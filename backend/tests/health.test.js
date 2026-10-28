const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

describe("GET /api/v1/health", () => {
  it("returns success payload", async () => {
    const res = await request(app).get("/api/v1/health");

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, "ok");
    assert.equal(res.body.message, "Manifestly API is running");
    assert.ok(res.headers["x-request-id"]);
  });

  it("echoes x-request-id when provided", async () => {
    const res = await request(app).get("/api/v1/health").set("x-request-id", "test-req-1");

    assert.equal(res.status, 200);
    assert.equal(res.headers["x-request-id"], "test-req-1");
    assert.equal(res.body.data.requestId, "test-req-1");
  });
});

describe("unknown routes", () => {
  it("returns NOT_FOUND error shape", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });
});
