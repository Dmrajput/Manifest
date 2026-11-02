const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000";
process.env.R2_ACCOUNT_ID = "d5edc90a184db102f29fcd347d5eb2bc";
process.env.R2_ACCESS_KEY_ID = "896c3afc96bcb0de38c82e6393dfbeb3";
process.env.R2_SECRET_ACCESS_KEY = "17fdb6c4717b26f1d0c10084d8455d3614a41a16e0f2de8f187d39900f89f880";
process.env.R2_BUCKET_NAME = "manifest-uploads";
process.env.R2_PUBLIC_URL = "https://pub-b3083634d0884c2fb98e96cbb39635d3.r2.dev";

let mongoServer;
let app;
let removeCalls;

function authHeader(overrides = {}) {
  const sub = overrides.sub || "vis-board-user";
  const token = jwt.sign(
    {
      sub,
      email: overrides.email || "vis@manifestly.test",
      role: "authenticated",
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return { token: `Bearer ${token}`, sub };
}

describe("Vision board functional API", () => {
  before(async () => {
    removeCalls = [];
    delete require.cache[require.resolve("../src/services/storageService")];
    delete require.cache[require.resolve("../src/services/visionService")];
    const storage = require("../src/services/storageService");
    storage.removeVisionObject = async (path) => {
      removeCalls.push(path);
      return { deleted: true, path };
    };
    storage.assertVisionObjectReady = async () => {};

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
    removeCalls = [];
    for (const key of Object.keys(mongoose.connection.collections)) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  it("VIS-002/003: rejects empty board title", async () => {
    const auth = authHeader();
    const res = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "   " });
    assert.equal(res.status, 400);
  });

  it("VIS-004/005: get board by id and rename", async () => {
    const auth = authHeader();
    const created = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Dream Home" });
    const boardId = created.body.data.board.id;

    const got = await request(app)
      .get(`/api/v1/vision-boards/${boardId}`)
      .set("Authorization", auth.token);
    assert.equal(got.status, 200);
    assert.equal(got.body.data.board.title, "Dream Home");

    const renamed = await request(app)
      .patch(`/api/v1/vision-boards/${boardId}`)
      .set("Authorization", auth.token)
      .send({ title: "Dream Life" });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.data.board.title, "Dream Life");
  });

  it("VIS-013/014: deleting item updates cover to next image", async () => {
    const auth = authHeader();
    const base = process.env.R2_PUBLIC_URL;
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Covers" });
    const boardId = board.body.data.board.id;

    const firstUrl = `${base}/vision/${auth.sub}/a.jpg`;
    const secondUrl = `${base}/vision/${auth.sub}/b.jpg`;

    await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", auth.token)
      .send({ image_path: firstUrl });
    const withTwo = await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", auth.token)
      .send({ image_path: secondUrl });
    const firstItemId = withTwo.body.data.board.items[0].id;

    const deleted = await request(app)
      .delete(`/api/v1/vision-boards/${boardId}/items/${firstItemId}`)
      .set("Authorization", auth.token);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.data.board.cover_image, secondUrl);
    assert.equal(deleted.body.data.board.item_count, 1);
  });

  it("VIS-015: update item caption", async () => {
    const auth = authHeader();
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Captions" });
    const boardId = board.body.data.board.id;
    const url = `${process.env.R2_PUBLIC_URL}/vision/${auth.sub}/cap.jpg`;

    const added = await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", auth.token)
      .send({ image_path: url });
    const itemId = added.body.data.board.items[0].id;

    const patched = await request(app)
      .patch(`/api/v1/vision-boards/${boardId}/items/${itemId}`)
      .set("Authorization", auth.token)
      .send({ caption: "My dream house" });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.board.items[0].caption, "My dream house");
  });

  it("VIS-006/029: delete board attempts storage cleanup for each item", async () => {
    const auth = authHeader();
    const url = `${process.env.R2_PUBLIC_URL}/vision/${auth.sub}/cleanup.jpg`;
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Cleanup" });
    const boardId = board.body.data.board.id;

    await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", auth.token)
      .send({ image_path: url });

    const deleted = await request(app)
      .delete(`/api/v1/vision-boards/${boardId}`)
      .set("Authorization", auth.token);
    assert.equal(deleted.status, 200);
    assert.ok(removeCalls.includes(url));
  });

  it("VIS-016/017: cross-user board access denied", async () => {
    const owner = authHeader({ sub: "owner-user", email: "owner@manifestly.test" });
    const other = authHeader({ sub: "other-user", email: "other@manifestly.test" });
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", owner.token)
      .send({ title: "Private" });
    const boardId = board.body.data.board.id;

    const denied = await request(app)
      .get(`/api/v1/vision-boards/${boardId}`)
      .set("Authorization", other.token);
    assert.equal(denied.status, 404);
  });

  it("VIS-018: free plan blocks fourth board", async () => {
    const auth = authHeader();
    for (let i = 1; i <= 3; i += 1) {
      const res = await request(app)
        .post("/api/v1/vision-boards")
        .set("Authorization", auth.token)
        .send({ title: `Board ${i}` });
      assert.equal(res.status, 201);
    }
    const blocked = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Board 4" });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.error.code, "PREMIUM_REQUIRED");
  });
});
