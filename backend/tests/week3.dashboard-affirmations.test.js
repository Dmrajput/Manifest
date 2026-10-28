const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");
const { buildFallbackAffirmations } = require("../src/services/aiAffirmationService");
const { FREE_DAILY_LIMIT } = require("../src/services/aiQuotaService");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
process.env.AI_AFFIRMATIONS_MOCK = "1";

let mongoServer;
let app;

function authHeader(overrides = {}) {
  const token = jwt.sign(
    {
      sub: overrides.sub || "auth-user-week3",
      email: overrides.email || "week3@manifestly.test",
      role: "authenticated",
      user_metadata: { name: "Alex" },
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return `Bearer ${token}`;
}

describe("ai affirmation fallback helper", () => {
  it("builds requested count of affirmations", () => {
    const items = buildFallbackAffirmations({ category: "career", tone: "calm", count: 4, goal: "promotion" });
    assert.equal(items.length, 4);
    assert.ok(items[0].text.includes("promotion") || items[0].text.includes("career"));
  });
});

describe("Week 3 dashboard & affirmations API", () => {
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

  it("GET /dashboard returns affirmation, rituals, and quota", async () => {
    const res = await request(app).get("/api/v1/dashboard").set("Authorization", authHeader());
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.greeting);
    assert.ok(res.body.data.affirmation_of_the_day?.text);
    assert.equal(res.body.data.rituals_total, 4);
    assert.equal(res.body.data.ai_quota.limit, FREE_DAILY_LIMIT);
    assert.equal(res.body.data.ai_quota.used, 0);
  });

  it("GET /affirmations seeds library and lists items", async () => {
    const res = await request(app).get("/api/v1/affirmations").set("Authorization", authHeader());
    assert.equal(res.status, 200);
    assert.ok(res.body.data.affirmations.length >= 5);
  });

  it("POST /affirmations/favorites marks favorite", async () => {
    const list = await request(app).get("/api/v1/affirmations").set("Authorization", authHeader());
    const id = list.body.data.affirmations[0].id;

    const fav = await request(app)
      .post("/api/v1/affirmations/favorites")
      .set("Authorization", authHeader())
      .send({ affirmation_id: id, is_favorite: true });

    assert.equal(fav.status, 200);
    assert.equal(fav.body.data.is_favorite, true);

    const favorites = await request(app)
      .get("/api/v1/affirmations?favoritesOnly=true")
      .set("Authorization", authHeader());
    assert.equal(favorites.status, 200);
    assert.equal(favorites.body.data.affirmations.length, 1);
    assert.equal(favorites.body.data.affirmations[0].id, id);
  });

  it("POST /ai/affirmations generates and enforces quota", async () => {
    const first = await request(app)
      .post("/api/v1/ai/affirmations")
      .set("Authorization", authHeader())
      .send({ category: "confidence", count: 3, tone: "encouraging" });

    assert.equal(first.status, 200);
    assert.ok(first.body.data.affirmations.length >= 3);
    assert.equal(first.body.data.provider, "fallback");
    assert.equal(first.body.data.quota.used, 1);

    // Exhaust remaining free quota (limit 3 → 2 more ok, 3rd extra fails after used=3)
    await request(app)
      .post("/api/v1/ai/affirmations")
      .set("Authorization", authHeader())
      .send({ category: "money", count: 3 });
    await request(app)
      .post("/api/v1/ai/affirmations")
      .set("Authorization", authHeader())
      .send({ category: "career", count: 3 });

    const blocked = await request(app)
      .post("/api/v1/ai/affirmations")
      .set("Authorization", authHeader())
      .send({ category: "wellness", count: 3 });

    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.error.code, "AI_QUOTA_EXCEEDED");
  });
});
