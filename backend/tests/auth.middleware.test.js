const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../src/middleware/auth");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("requireAuth middleware", () => {
  before(() => {
    process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
  });

  it("rejects missing Authorization header", () => {
    const req = { headers: {} };
    const res = mockRes();
    let called = false;
    requireAuth(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, "UNAUTHORIZED");
  });

  it("rejects invalid token", () => {
    const req = { headers: { authorization: "Bearer not-a-jwt" } };
    const res = mockRes();
    let called = false;
    requireAuth(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 401);
  });

  it("accepts valid HS256 Supabase-style token", () => {
    const token = jwt.sign(
      { sub: "user-123", email: "alex@example.com", role: "authenticated" },
      process.env.SUPABASE_JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let called = false;
    requireAuth(req, res, () => {
      called = true;
    });
    assert.equal(called, true);
    assert.equal(req.auth.id, "user-123");
    assert.equal(req.auth.email, "alex@example.com");
  });
});
