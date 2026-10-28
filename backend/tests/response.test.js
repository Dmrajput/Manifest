const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { success, fail } = require("../src/utils/response");

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

describe("response helpers", () => {
  it("success wraps data", () => {
    const res = mockRes();
    success(res, { data: { ok: true }, message: "done" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      data: { ok: true },
      message: "done",
    });
  });

  it("fail wraps error code", () => {
    const res = mockRes();
    fail(res, { code: "VALIDATION_ERROR", message: "Invalid", status: 400 });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });
});
