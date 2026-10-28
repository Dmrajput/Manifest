const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";

let mongoServer;
let app;

function authHeader(overrides = {}) {
  const token = jwt.sign(
    {
      sub: overrides.sub || "auth-user-1",
      email: overrides.email || "alex@manifestly.test",
      role: "authenticated",
      user_metadata: { name: overrides.name || "Alex" },
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return `Bearer ${token}`;
}

describe("GET/PATCH /api/v1/users/me", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase(process.env.MONGODB_URI);
    // Load app after env is ready
    delete require.cache[require.resolve("../src/app")];
    app = require("../src/app");
  });

  after(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/users/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("creates and returns profile on first GET", async () => {
    const res = await request(app).get("/api/v1/users/me").set("Authorization", authHeader());
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, "alex@manifestly.test");
    assert.equal(res.body.data.user.authProviderId, "auth-user-1");
    assert.equal(res.body.data.user.onboarding_completed, false);
  });

  it("updates preferences and onboarding flag", async () => {
    await request(app).get("/api/v1/users/me").set("Authorization", authHeader());

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", authHeader())
      .send({
        name: "Alex Rivera",
        onboarding_completed: true,
        preferences: {
          categories: ["career", "confidence"],
          language: "en",
          theme: "light",
        },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, "Alex Rivera");
    assert.equal(res.body.data.user.onboarding_completed, true);
    assert.deepEqual(res.body.data.user.preferences.categories, ["career", "confidence"]);
    assert.equal(res.body.data.user.preferences.theme, "light");
  });

  it("rejects invalid patch body", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", authHeader())
      .send({ preferences: { theme: "neon" } });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });
});
