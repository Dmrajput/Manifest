const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { connectDatabase, getConnectionState } = require("../src/config/database");

describe("database config", () => {
  it("requires MONGODB_URI", async () => {
    await assert.rejects(() => connectDatabase(undefined), /MONGODB_URI is not set/);
  });

  it("exposes connection state helper", () => {
    assert.equal(typeof getConnectionState(), "number");
  });
});
