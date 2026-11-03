const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

describe("Public legal pages", () => {
  it("serves privacy policy HTML", async () => {
    const res = await request(app).get("/legal/privacy");
    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /html/);
    assert.match(res.text, /Privacy Policy/);
    assert.match(res.text, /Manifestly AI/);
  });

  it("serves terms of service HTML", async () => {
    const res = await request(app).get("/legal/terms");
    assert.equal(res.status, 200);
    assert.match(res.text, /Terms of Service/);
  });

  it("serves privacy JSON for clients", async () => {
    const res = await request(app).get("/legal/privacy.json");
    assert.equal(res.status, 200);
    assert.equal(res.body.title, "Privacy Policy");
    assert.ok(Array.isArray(res.body.sections));
  });
});
