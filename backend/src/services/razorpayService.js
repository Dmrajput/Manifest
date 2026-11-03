const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Subscription } = require("../models");

const PLANS = {
  premium_monthly: {
    amountPaise: Number(process.env.PREMIUM_MONTHLY_PAISE) || 9900,
    days: 30,
    label: "Manifestly Premium — Monthly",
  },
  premium_yearly: {
    amountPaise: Number(process.env.PREMIUM_YEARLY_PAISE) || 69900,
    days: 365,
    label: "Manifestly Premium — Yearly",
  },
};

function isConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

function getClient() {
  if (!isConfigured()) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
  });
}

function getPlan(productId) {
  return PLANS[productId] || null;
}

function listPlans() {
  return Object.entries(PLANS).map(([id, plan]) => ({
    product_id: id,
    amount_paise: plan.amountPaise,
    amount_inr: plan.amountPaise / 100,
    duration_days: plan.days,
    label: plan.label,
  }));
}

async function createPremiumOrder(user, productId) {
  const plan = getPlan(productId);
  if (!plan) {
    const error = new Error("Unknown premium plan");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const client = getClient();
  if (!client) {
    const error = new Error("Payments are not configured on the server");
    error.status = 503;
    error.code = "PAYMENTS_NOT_CONFIGURED";
    throw error;
  }

  const receipt = `ml_${String(user._id).slice(-8)}_${Date.now()}`.slice(0, 40);
  const order = await client.orders.create({
    amount: plan.amountPaise,
    currency: "INR",
    receipt,
    notes: {
      user_id: String(user._id),
      product_id: productId,
    },
  });

  return {
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    product_id: productId,
    description: plan.label,
    prefill: {
      email: user.email || undefined,
      name: user.name || undefined,
    },
  };
}

function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
}

async function fetchCapturedPayment(client, paymentId, orderId) {
  const payment = await client.payments.fetch(paymentId);
  if (!payment || payment.order_id !== orderId) {
    const error = new Error("Payment does not match this order");
    error.status = 400;
    error.code = "PAYMENT_INVALID";
    throw error;
  }
  if (payment.status !== "captured" && payment.status !== "authorized") {
    const error = new Error(`Payment not completed (${payment.status})`);
    error.status = 402;
    error.code = "PAYMENT_INCOMPLETE";
    throw error;
  }
  return payment;
}

async function activatePremiumFromPayment(userId, { productId, paymentId, orderId }) {
  const plan = getPlan(productId);
  if (!plan) {
    const error = new Error("Unknown premium plan");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const expiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000);

  const sub = await Subscription.findOneAndUpdate(
    { user_id: userId, product_id: productId },
    {
      $set: {
        status: "active",
        expires_at: expiresAt,
        external_id: paymentId,
        provider: "razorpay",
      },
      $setOnInsert: { user_id: userId, product_id: productId },
    },
    { new: true, upsert: true },
  );

  return {
    subscription: sub,
    expires_at: expiresAt,
    order_id: orderId,
    payment_id: paymentId,
  };
}

async function verifyAndActivatePremium(userId, { productId, orderId, paymentId, signature }) {
  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    const error = new Error("Invalid payment signature");
    error.status = 400;
    error.code = "PAYMENT_SIGNATURE_INVALID";
    throw error;
  }

  const client = getClient();
  if (!client) {
    const error = new Error("Payments are not configured on the server");
    error.status = 503;
    error.code = "PAYMENTS_NOT_CONFIGURED";
    throw error;
  }

  await fetchCapturedPayment(client, paymentId, orderId);
  return activatePremiumFromPayment(userId, { productId, paymentId, orderId });
}

module.exports = {
  PLANS,
  isConfigured,
  listPlans,
  createPremiumOrder,
  verifyAndActivatePremium,
  verifyCheckoutSignature,
};
