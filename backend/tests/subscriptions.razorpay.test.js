const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, disconnectDatabase, mongoose } = require("../src/config/database");
const razorpayService = require("../src/services/razorpayService");

process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret";
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000";

let mongoServer;
let app;

function authHeader() {
  const token = jwt.sign(
    { sub: "rzp-user", email: "rzp@manifestly.test", role: "authenticated" },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" },
  );
  return `Bearer ${token}`;
}

describe("Razorpay subscriptions", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDatabase(process.env.MONGODB_URI);
  });

  after(async () => {
    await disconnectDatabase();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    for (const key of Object.keys(mongoose.connection.collections)) {
      await mongoose.connection.collections[key].deleteMany({});
    }
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete require.cache[require.resolve("../src/app")];
    app = require("../src/app");
  });

  it("entitlement reports payments_configured=false without keys", async () => {
    const res = await request(app).get("/api/v1/subscriptions/entitlement").set("Authorization", authHeader());
    assert.equal(res.status, 200);
    assert.equal(res.body.data.payments_configured, false);
    assert.ok(Array.isArray(res.body.data.plans));
    assert.equal(res.body.data.premium, false);
  });

  it("create-order returns 503 when Razorpay is not configured", async () => {
    const res = await request(app)
      .post("/api/v1/subscriptions/razorpay/create-order")
      .set("Authorization", authHeader())
      .send({ plan: "monthly" });
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, "PAYMENTS_NOT_CONFIGURED");
  });

  it("verify rejects invalid signature", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "test_secret_for_hmac";
    delete require.cache[require.resolve("../src/app")];
    app = require("../src/app");

    const res = await request(app)
      .post("/api/v1/subscriptions/razorpay/verify")
      .set("Authorization", authHeader())
      .send({
        plan: "monthly",
        razorpay_order_id: "order_abc",
        razorpay_payment_id: "pay_xyz",
        razorpay_signature: "bad_signature",
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "PAYMENT_SIGNATURE_INVALID");
  });

  it("verifyCheckoutSignature accepts valid HMAC", () => {
    process.env.RAZORPAY_KEY_SECRET = "unit_test_secret";
    const orderId = "order_1";
    const paymentId = "pay_2";
    const signature = crypto.createHmac("sha256", "unit_test_secret").update(`${orderId}|${paymentId}`).digest("hex");
    assert.equal(razorpayService.verifyCheckoutSignature({ orderId, paymentId, signature }), true);
  });
});
