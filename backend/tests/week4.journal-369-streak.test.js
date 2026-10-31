const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");
const { calculateStreak } = require("../src/services/streakService");
const { User, JournalEntry, UserActivity } = require("../src/models");
const { dateKeyToUtcDate, shiftDateKey, getDateKeyInTimezone } = require("../src/utils/timezone");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";

let mongoServer;
let app;

function authHeader(overrides = {}) {
  const token = jwt.sign(
    {
      sub: overrides.sub || "auth-user-week4",
      email: overrides.email || "week4@manifestly.test",
      role: "authenticated",
      user_metadata: { name: "Alex" },
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return `Bearer ${token}`;
}

describe("Week 4 journal, 369, streak", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase(process.env.MONGODB_URI);
    delete require.cache[require.resolve("../src/app")];
    app = require("../src/app");
  });

  after(async () => {
    await disconnectDatabase();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  });

  it("supports journal CRUD", async () => {
    const created = await request(app)
      .post("/api/v1/journal")
      .set("Authorization", authHeader())
      .send({ content: "I am grateful for progress.", type: "gratitude", mood: 5 });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.entry.type, "gratitude");

    const daily = await request(app)
      .post("/api/v1/journal")
      .set("Authorization", authHeader())
      .send({ content: "Daily reflection kept as free_write.", type: "free_write" });
    assert.equal(daily.status, 201);
    assert.equal(daily.body.data.entry.type, "free_write");

    const filtered = await request(app)
      .get("/api/v1/journal")
      .query({ type: "free_write" })
      .set("Authorization", authHeader());
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.data.entries.length >= 1);
    assert.ok(filtered.body.data.entries.every((item) => item.type === "free_write"));
    const id = created.body.data.entry.id;

    const listed = await request(app).get("/api/v1/journal").set("Authorization", authHeader());
    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.entries.length, 2);

    const updated = await request(app)
      .patch(`/api/v1/journal/${id}`)
      .set("Authorization", authHeader())
      .send({ content: "Updated gratitude note." });
    assert.equal(updated.status, 200);
    assert.match(updated.body.data.entry.content, /Updated/);

    const deleted = await request(app).delete(`/api/v1/journal/${id}`).set("Authorization", authHeader());
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.data.deleted, true);

    const remaining = await request(app).get("/api/v1/journal").set("Authorization", authHeader());
    assert.equal(remaining.body.data.entries.length, 1);
    assert.equal(remaining.body.data.entries[0].type, "free_write");
  });

  it("records 369 practice with period targets", async () => {
    const morning = await request(app)
      .post("/api/v1/practice/369")
      .set("Authorization", authHeader())
      .send({ period: "morning", count: 3, content: "I am abundant." });
    assert.equal(morning.status, 200);
    assert.equal(morning.body.data.session.complete, true);
    assert.equal(morning.body.data.today.day_complete, false);

    await request(app)
      .post("/api/v1/practice/369")
      .set("Authorization", authHeader())
      .send({ period: "afternoon", count: 6 });
    const evening = await request(app)
      .post("/api/v1/practice/369")
      .set("Authorization", authHeader())
      .send({ period: "evening", count: 9 });

    assert.equal(evening.status, 200);
    assert.equal(evening.body.data.today.day_complete, true);

    const today = await request(app).get("/api/v1/practice/369/today").set("Authorization", authHeader());
    assert.equal(today.status, 200);
    assert.equal(today.body.data.day_complete, true);
  });

  it("calculates consecutive streak in user timezone", async () => {
    const user = await User.create({
      email: "streak@manifestly.test",
      authProviderId: "streak-user",
      timezone: "UTC",
      name: "Streak",
    });

    const today = getDateKeyInTimezone(new Date(), "UTC");
    const yesterday = shiftDateKey(today, -1);
    const twoDaysAgo = shiftDateKey(today, -2);

    // Use native collection updates so Mongoose timestamps cannot overwrite historical dates
    for (const key of [twoDaysAgo, yesterday, today]) {
      const activity = await UserActivity.create({
        user_id: user._id,
        activity_type: "journal_create",
        metadata: { seed: key },
      });
      await UserActivity.collection.updateOne(
        { _id: activity._id },
        { $set: { created_at: dateKeyToUtcDate(key) } }
      );

      const entry = await JournalEntry.create({
        user_id: user._id,
        content: `entry ${key}`,
      });
      await JournalEntry.collection.updateOne(
        { _id: entry._id },
        { $set: { created_at: dateKeyToUtcDate(key) } }
      );
    }

    const streak = await calculateStreak(user._id, "UTC");
    assert.equal(streak.streak_days, 3);
    assert.equal(streak.qualified_today, true);

    const progress = await request(app)
      .get("/api/v1/progress")
      .set("Authorization", authHeader({ sub: "streak-user", email: "streak@manifestly.test" }));
    assert.equal(progress.status, 200);
    assert.ok(progress.body.data.streak.streak_days >= 1);
  });
});
