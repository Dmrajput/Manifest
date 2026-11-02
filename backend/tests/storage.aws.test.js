const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("Cloudflare R2 vision storage helpers", () => {
  const previous = {};

  before(() => {
    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_URL",
      "R2_VISION_PREFIX",
      "AWS_ACCESS_KEY",
      "AWS_SECRET_KEY",
      "AWS_BUCKET_NAME",
      "AWS_REGION",
    ]) {
      previous[key] = process.env[key];
    }
    process.env.R2_ACCOUNT_ID = "d5edc90a184db102f29fcd347d5eb2bc";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET_NAME = "manifest-uploads";
    process.env.R2_PUBLIC_URL = "https://pub-b3083634d0884c2fb98e96cbb39635d3.r2.dev";
    process.env.R2_VISION_PREFIX = "vision";
    delete process.env.AWS_ACCESS_KEY;
    delete process.env.AWS_SECRET_KEY;
    delete process.env.AWS_BUCKET_NAME;
    delete process.env.AWS_REGION;
    delete require.cache[require.resolve("../src/services/storageService")];
  });

  after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    delete require.cache[require.resolve("../src/services/storageService")];
  });

  it("builds public R2 URLs and recognizes owned object keys", () => {
    const storage = require("../src/services/storageService");
    const userId = "user-123";
    const key = `vision/${userId}/photo.jpg`;
    const url = storage.publicObjectUrl(key);
    assert.equal(url, "https://pub-b3083634d0884c2fb98e96cbb39635d3.r2.dev/vision/user-123/photo.jpg");
    assert.equal(storage.isOwnedVisionPath(userId, key), true);
    assert.equal(storage.isOwnedVisionPath(userId, url), true);
    assert.equal(storage.isOwnedVisionPath(userId, "vision/other-user/photo.jpg"), false);
    assert.doesNotThrow(() =>
      storage.assertOwnedVisionPath(userId, "https://images.unsplash.com/photo.jpg")
    );
  });

  it("extracts object keys from r2.dev public URLs", () => {
    const storage = require("../src/services/storageService");
    const key = storage.extractObjectKey(
      "https://pub-b3083634d0884c2fb98e96cbb39635d3.r2.dev/vision/user-123/photo.jpg"
    );
    assert.equal(key, "vision/user-123/photo.jpg");
  });
});
