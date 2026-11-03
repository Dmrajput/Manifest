const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { shouldUseLocalAiFallback, isProductionEnv } = require("../src/utils/aiMode");

describe("AI production mode guards", () => {
  it("disables local mock fallback in production", () => {
    const prevNode = process.env.NODE_ENV;
    const prevMock = process.env.AI_COACH_MOCK;
    process.env.NODE_ENV = "production";
    process.env.AI_COACH_MOCK = "1";
    try {
      assert.equal(isProductionEnv(), true);
      assert.equal(
        shouldUseLocalAiFallback({ mockEnvKey: "AI_COACH_MOCK", configured: false }),
        false,
      );
    } finally {
      process.env.NODE_ENV = prevNode;
      process.env.AI_COACH_MOCK = prevMock;
    }
  });

  it("allows dev mock when not production", () => {
    const prevNode = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    try {
      assert.equal(shouldUseLocalAiFallback({ mockEnvKey: "AI_COACH_MOCK", configured: false }), true);
    } finally {
      process.env.NODE_ENV = prevNode;
    }
  });
});
