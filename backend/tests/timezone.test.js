const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { getDateKeyInTimezone, shiftDateKey, normalizeTimezone } = require("../src/utils/timezone");

describe("timezone helpers", () => {
  it("normalizes invalid timezone to UTC", () => {
    assert.equal(normalizeTimezone("Not/AZone"), "UTC");
    assert.equal(normalizeTimezone("Asia/Kolkata"), "Asia/Kolkata");
  });

  it("formats date keys as YYYY-MM-DD", () => {
    const key = getDateKeyInTimezone(new Date("2026-10-28T18:30:00.000Z"), "UTC");
    assert.equal(key, "2026-10-28");
  });

  it("shifts date keys across month boundaries", () => {
    assert.equal(shiftDateKey("2026-11-01", -1), "2026-10-31");
  });
});
