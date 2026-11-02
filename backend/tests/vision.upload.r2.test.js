/**
 * Vision board image upload — API + Cloudflare R2 flow.
 * Maps: VIS-003, VIS-004 (partial), storage ownership.
 */
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000";

// R2 config for presigned URL generation (local signing; no network required).
process.env.R2_ACCOUNT_ID = "d5edc90a184db102f29fcd347d5eb2bc";
process.env.R2_ACCESS_KEY_ID = "896c3afc96bcb0de38c82e6393dfbeb3";
process.env.R2_SECRET_ACCESS_KEY = "17fdb6c4717b26f1d0c10084d8455d3614a41a16e0f2de8f187d39900f89f880";
process.env.R2_BUCKET_NAME = "manifest-uploads";
process.env.R2_VISION_PREFIX = "vision";
process.env.R2_PUBLIC_URL = "https://pub-b3083634d0884c2fb98e96cbb39635d3.r2.dev";

let mongoServer;
let app;

function authHeader(overrides = {}) {
  const sub = overrides.sub || "vis-upload-user";
  const token = jwt.sign(
    {
      sub,
      email: overrides.email || "vis@manifestly.test",
      role: "authenticated",
      user_metadata: { name: "Vision Tester" },
    },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return { token: `Bearer ${token}`, sub };
}

function purgeAppCache() {
  delete require.cache[require.resolve("../src/services/storageService")];
  delete require.cache[require.resolve("../src/services/visionService")];
  delete require.cache[require.resolve("../src/app")];
}

describe("Vision upload — upload-url API (R2)", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase(process.env.MONGODB_URI);
    purgeAppCache();
    const storage = require("../src/services/storageService");
    storage.assertVisionObjectReady = async () => {};
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

  it("VIS-003: returns Cloudflare R2 presigned upload plan for authenticated user", async () => {
    const auth = authHeader();
    const res = await request(app)
      .post("/api/v1/vision-boards/upload-url")
      .set("Authorization", auth.token)
      .send({ content_type: "image/jpeg" });

    assert.equal(res.status, 200);
    const upload = res.body.data.upload;
    assert.equal(upload.provider, "cloudflare_r2");
    assert.equal(upload.mode, "s3_presigned");
    assert.equal(upload.bucket, "manifest-uploads");
    assert.match(upload.path, new RegExp(`^vision/${auth.sub}/[0-9a-f-]+\\.jpg$`));
    assert.ok(upload.upload_url);
    assert.match(upload.upload_url, /r2\.cloudflarestorage\.com/);
    assert.equal(upload.public_url, `${process.env.R2_PUBLIC_URL}/${upload.path}`);
    assert.equal(upload.content_type, "image/jpeg");
    assert.ok(upload.max_bytes > 0);
  });

  it("VIS-004: rejects unsupported upload content types", async () => {
    const auth = authHeader();
    const res = await request(app)
      .post("/api/v1/vision-boards/upload-url")
      .set("Authorization", auth.token)
      .send({ content_type: "application/pdf" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("accepts owned R2 public URL when attaching board item (VIS-003 attach step)", async () => {
    const auth = authHeader();
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Upload test board" });
    assert.equal(board.status, 201);
    const boardId = board.body.data.board.id;

    const ownedUrl = `${process.env.R2_PUBLIC_URL}/vision/${auth.sub}/test-photo.jpg`;
    const item = await request(app)
      .post(`/api/v1/vision-boards/${boardId}/items`)
      .set("Authorization", auth.token)
      .send({ image_path: ownedUrl, caption: "From R2" });

    assert.equal(item.status, 201);
    assert.equal(item.body.data.board.items.length, 1);
    assert.equal(item.body.data.board.items[0].image_path, ownedUrl);
    assert.equal(item.body.data.board.cover_image, ownedUrl);
  });

  it("rejects foreign R2 object paths for board items", async () => {
    const auth = authHeader();
    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Secure" });
    const denied = await request(app)
      .post(`/api/v1/vision-boards/${board.body.data.board.id}/items`)
      .set("Authorization", auth.token)
      .send({
        image_path: `${process.env.R2_PUBLIC_URL}/vision/other-user/secret.jpg`,
      });
    assert.equal(denied.status, 403);
  });
});

describe("Vision upload — live R2 PUT integration", () => {
  before(async () => {
    require("dotenv").config();
    if (process.env.RUN_VISION_UPLOAD_INTEGRATION !== "1") {
      return;
    }
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase(process.env.MONGODB_URI);
    purgeAppCache();
    app = require("../src/app");
  });

  after(async () => {
    if (process.env.RUN_VISION_UPLOAD_INTEGRATION !== "1") return;
    await disconnectDatabase();
    if (mongoServer) await mongoServer.stop();
  });

  it("VIS-003 E2E: presign, PUT to R2, attach item, public URL readable", async (t) => {
    if (process.env.RUN_VISION_UPLOAD_INTEGRATION !== "1") {
      t.skip("Set RUN_VISION_UPLOAD_INTEGRATION=1 to run live Cloudflare R2 upload");
    }

    const storage = require("../src/services/storageService");
    if (!storage.r2Configured()) {
      assert.fail("R2 env not configured for integration test");
    }

    const auth = authHeader({ sub: "vis-live-user" });
    const planRes = await request(app)
      .post("/api/v1/vision-boards/upload-url")
      .set("Authorization", auth.token)
      .send({ content_type: "image/jpeg" });
    assert.equal(planRes.status, 200);
    const plan = planRes.body.data.upload;

    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
      "base64"
    );

    const putRes = await fetch(plan.upload_url, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: jpeg,
    });
    assert.equal(putRes.status, 200, await putRes.text().catch(() => ""));

    const publicGet = await fetch(plan.public_url);
    assert.equal(publicGet.status, 200);

    const board = await request(app)
      .post("/api/v1/vision-boards")
      .set("Authorization", auth.token)
      .send({ title: "Live R2 board" });
    assert.equal(board.status, 201);

    const item = await request(app)
      .post(`/api/v1/vision-boards/${board.body.data.board.id}/items`)
      .set("Authorization", auth.token)
      .send({ image_path: plan.public_url, caption: "Live upload" });
    assert.equal(item.status, 201);
    assert.equal(item.body.data.board.items[0].image_path, plan.public_url);

    await storage.removeVisionObject(plan.path);
  });
});
