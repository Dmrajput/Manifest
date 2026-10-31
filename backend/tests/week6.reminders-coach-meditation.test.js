const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
process.env.AI_COACH_MOCK = "1";
process.env.AI_AFFIRMATIONS_MOCK = "1";
process.env.NODE_ENV = "test";

let mongoServer;
let app;

function authHeader(overrides = {}) {
  const token = jwt.sign(
    {
      sub: overrides.sub || "auth-user-week6",
      email: overrides.email || "week6@manifestly.test",
      role: "authenticated",
      user_metadata: { name: "Alex" },
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return `Bearer ${token}`;
}

describe("Week 6+ reminders, coach, meditation, account", () => {
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

  it("seeds and updates reminders", async () => {
    const listed = await request(app).get("/api/v1/reminders").set("Authorization", authHeader());
    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.reminders.length, 3);

    const updated = await request(app)
      .put("/api/v1/reminders")
      .set("Authorization", authHeader())
      .send({ type: "morning", hour: 7, minute: 30, enabled: false });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.reminder.hour, 7);
    assert.equal(updated.body.data.reminder.enabled, false);
  });

  it("supports AI coach conversation and deletes it", async () => {
    const sent = await request(app)
      .post("/api/v1/ai/conversations/messages")
      .set("Authorization", authHeader())
      .send({ message: "Help me build confidence" });
    assert.equal(sent.status, 200);
    assert.ok(sent.body.data.reply);
    const id = sent.body.data.conversation.id;

    const got = await request(app)
      .get(`/api/v1/ai/conversations/${id}`)
      .set("Authorization", authHeader());
    assert.equal(got.status, 200);
    assert.ok(got.body.data.conversation.messages.length >= 2);

    const deleted = await request(app)
      .delete(`/api/v1/ai/conversations/${id}`)
      .set("Authorization", authHeader());
    assert.equal(deleted.status, 200);
  });

  it("generates goal plan without duplicates when saving", async () => {
    const goal = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", authHeader())
      .send({ title: "Travel the World", tasks: [{ title: "Week 1: Research step for Travel the World" }] });
    const goalId = goal.body.data.goal.id;

    const plan = await request(app)
      .post("/api/v1/ai/goal-plans")
      .set("Authorization", authHeader())
      .send({ goal_id: goalId, weeks: 2, save: true });
    assert.equal(plan.status, 200);
    assert.ok(plan.body.data.plan.tasks.length >= 2);
    const titles = plan.body.data.goal.tasks.map((t) => t.title);
    assert.equal(new Set(titles).size, titles.length);
  });

  it("lists meditation tracks and locks premium without entitlement", async () => {
    const listed = await request(app).get("/api/v1/meditation").set("Authorization", authHeader());
    assert.equal(listed.status, 200);
    const premium = listed.body.data.tracks.find((t) => t.is_premium);
    assert.ok(premium);
    assert.equal(premium.locked, true);
    assert.equal(premium.audio_path, null);
  });

  it("rejects foreign vision storage paths", async () => {
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", authHeader())
      .send({ title: "Secure board" });
    const boardId = board.body.data.board.id;

    const denied = await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", authHeader())
      .send({ image_path: "other-user/secret.jpg" });
    assert.equal(denied.status, 403);
  });

  it("deletes account and related data", async () => {
    await request(app)
      .post("/api/v1/journal")
      .set("Authorization", authHeader())
      .send({ content: "temp", type: "gratitude" });

    const deleted = await request(app).delete("/api/v1/users/me").set("Authorization", authHeader());
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.data.deleted, true);

    const journal = await request(app).get("/api/v1/journal").set("Authorization", authHeader());
    // getOrCreate recreates user; journal should be empty for new user id mapping... same auth id recreates user
    assert.equal(journal.status, 200);
    assert.equal(journal.body.data.entries.length, 0);
  });

  it("updates notification preferences on profile", async () => {
    const patched = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", authHeader())
      .send({
        name: "Alex",
        preferences: { theme: "dark", language: "en", notifications: { morning: false } },
      });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.user.preferences.theme, "dark");
    assert.equal(patched.body.data.user.preferences.notifications.morning, false);
  });
});
