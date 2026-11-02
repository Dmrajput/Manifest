const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
process.env.R2_ACCOUNT_ID = "d5edc90a184db102f29fcd347d5eb2bc";
process.env.R2_ACCESS_KEY_ID = "896c3afc96bcb0de38c82e6393dfbeb3";
process.env.R2_SECRET_ACCESS_KEY = "17fdb6c4717b26f1d0c10084d8455d3614a41a16e0f2de8f187d39900f89f880";
process.env.R2_BUCKET_NAME = "manifest-uploads";
process.env.R2_PUBLIC_URL = "https://pub-b3083634d0884c2fb98e96cbb39635d3.r2.dev";

let mongoServer;
let app;
let removedUrls;

function authHeader(sub = "profile-user-1") {
  const token = jwt.sign(
    { sub, email: "profile@manifestly.test", role: "authenticated" },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return `Bearer ${token}`;
}

describe("Profile avatar upload API", () => {
  before(async () => {
    removedUrls = [];
    delete require.cache[require.resolve("../src/services/storageService")];
    const storage = require("../src/services/storageService");
    storage.removeProfileAvatarIfOwned = async (_auth, url) => {
      removedUrls.push(url);
      return { deleted: true };
    };
    storage.assertProfileObjectReady = async () => {};

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
    removedUrls = [];
    for (const key of Object.keys(mongoose.connection.collections)) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  it("returns presigned profile upload plan with 512KB cap", async () => {
    const res = await request(app)
      .post("/api/v1/users/me/avatar/upload-url")
      .set("Authorization", authHeader())
      .send({ content_type: "image/jpeg" });
    assert.equal(res.status, 200);
    assert.match(res.body.data.upload.path, /^profile\/profile-user-1\/avatar\.jpg$/);
    assert.equal(res.body.data.upload.max_bytes, 512 * 1024);
  });

  it("replaces avatar and deletes previous R2 object", async () => {
    const sub = "profile-user-1";
    const first = `${process.env.R2_PUBLIC_URL}/profile/${sub}/avatar.jpg`;
    const second = `${process.env.R2_PUBLIC_URL}/profile/${sub}/avatar.png`;

    await request(app).get("/api/v1/users/me").set("Authorization", authHeader(sub));

    const r1 = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", authHeader(sub))
      .send({ avatar: first });
    assert.equal(r1.status, 200);

    const r2 = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", authHeader(sub))
      .send({ avatar: second });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.data.user.avatar, second);
    assert.ok(removedUrls.includes(first));
  });
});
