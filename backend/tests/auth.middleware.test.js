const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../src/middleware/auth");
const { resetSupabaseAdminForTests } = require("../src/config/supabase");

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
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetSupabaseAdminForTests();
  });

  it("rejects missing Authorization header", async () => {
    const req = { headers: {} };
    const res = mockRes();
    let called = false;
    await requireAuth(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, "UNAUTHORIZED");
  });

  it("rejects invalid token", async () => {
    const req = { headers: { authorization: "Bearer not-a-jwt" } };
    const res = mockRes();
    let called = false;
    await requireAuth(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 401);
  });

  it("accepts valid HS256 Supabase-style token", async () => {
    const token = jwt.sign(
      { sub: "user-123", email: "alex@example.com", role: "authenticated" },
      process.env.SUPABASE_JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let called = false;
    await requireAuth(req, res, () => {
      called = true;
    });
    assert.equal(called, true);
    assert.equal(req.auth.id, "user-123");
    assert.equal(req.auth.email, "alex@example.com");
  });
});
