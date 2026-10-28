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
      sub: overrides.sub || "auth-user-week5",
      email: overrides.email || "week5@manifestly.test",
      role: "authenticated",
      user_metadata: { name: "Alex" },
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return `Bearer ${token}`;
}

describe("Week 5 goals and vision boards", () => {
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

  it("rejects unauthenticated goals access", async () => {
    const res = await request(app).get("/api/v1/goals");
    assert.equal(res.status, 401);
  });

  it("supports goal CRUD and task completion progress", async () => {
    const created = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", authHeader())
      .send({
        title: "Financial Freedom",
        tasks: [{ title: "Save 10k", weight: 1 }, { title: "Start side hustle", weight: 1 }],
      });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.goal.progress, 0);
    const goalId = created.body.data.goal.id;
    const taskId = created.body.data.goal.tasks[0].id;

    const completed = await request(app)
      .patch(`/api/v1/goals/${goalId}/tasks/${taskId}`)
      .set("Authorization", authHeader())
      .send({ completed: true });

    assert.equal(completed.status, 200);
    assert.equal(completed.body.data.goal.progress, 50);

    const listed = await request(app).get("/api/v1/goals").set("Authorization", authHeader());
    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.goals.length, 1);

    const deleted = await request(app)
      .delete(`/api/v1/goals/${goalId}`)
      .set("Authorization", authHeader());
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.data.deleted, true);
  });

  it("isolates goals between users (IDOR protection)", async () => {
    const created = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", authHeader({ sub: "user-a", email: "a@test.com" }))
      .send({ title: "Private goal" });
    const goalId = created.body.data.goal.id;

    const other = await request(app)
      .get(`/api/v1/goals/${goalId}`)
      .set("Authorization", authHeader({ sub: "user-b", email: "b@test.com" }));
    assert.equal(other.status, 404);
  });

  it("supports vision board create, items, and free limit", async () => {
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", authHeader())
      .send({ title: "My Dream Life" });
    assert.equal(board.status, 201);
    const boardId = board.body.data.board.id;

    const withItem = await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", authHeader())
      .send({ image_path: "https://example.com/dream.jpg", caption: "Lake house" });
    assert.equal(withItem.status, 201);
    assert.equal(withItem.body.data.board.items.length, 1);

    await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", authHeader())
      .send({ title: "Board 2" });
    await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", authHeader())
      .send({ title: "Board 3" });

    const blocked = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", authHeader())
      .send({ title: "Board 4" });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.error.code, "PREMIUM_REQUIRED");
  });
});
