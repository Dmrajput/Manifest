const { z } = require("zod");
const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const { Subscription } = require("../models");
const aiQuotaService = require("../services/aiQuotaService");
const razorpayService = require("../services/razorpayService");
const {
  signWebCheckoutToken,
  verifyWebCheckoutToken,
  buildWebCheckoutUrl,
  renderCheckoutHtml,
} = require("../services/razorpayWebCheckout");

const verifySchema = z.object({
  product_id: z.string().trim().min(1),
  status: z.enum(["active", "canceled", "expired", "grace_period", "trial"]),
  expires_at: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
  provider: z.string().optional(),
});

const createOrderSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

const verifyPaymentSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

function productIdFromPlan(plan) {
  return plan === "yearly" ? "premium_yearly" : "premium_monthly";
}

async function getEntitlement(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const premium = await aiQuotaService.isPremiumUser(user._id);
    const sub = await Subscription.findOne({ user_id: user._id }).sort({ updated_at: -1 });
    return success(res, {
      data: {
        premium,
        payments_configured: razorpayService.isConfigured(),
        plans: razorpayService.listPlans(),
        subscription: sub
          ? {
              product_id: sub.product_id,
              status: sub.status,
              expires_at: sub.expires_at,
              provider: sub.provider,
            }
          : null,
      },
      message: "Entitlement loaded",
    });
  } catch (error) {
    return next(error);
  }
}

async function createRazorpayOrder(req, res, next) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid plan",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    const productId = productIdFromPlan(parsed.data.plan);
    const checkout = await razorpayService.createPremiumOrder(user, productId);
    const token = signWebCheckoutToken({
      plan: parsed.data.plan,
      order_id: checkout.order_id,
      amount: checkout.amount,
      key_id: checkout.key_id,
      description: checkout.description,
      product_id: checkout.product_id,
      prefill: checkout.prefill,
    });
    const web_checkout_url = buildWebCheckoutUrl(req, token);

    return success(res, {
      data: {
        checkout: {
          ...checkout,
          web_checkout_url,
        },
      },
      message: "Razorpay order created",
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyRazorpayPayment(req, res, next) {
  try {
    const parsed = verifyPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid payment verification payload",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    const productId = productIdFromPlan(parsed.data.plan);
    const result = await razorpayService.verifyAndActivatePremium(user._id, {
      productId,
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });

    const sub = result.subscription;
    return success(res, {
      data: {
        premium: true,
        subscription: {
          product_id: sub.product_id,
          status: sub.status,
          expires_at: sub.expires_at,
          provider: sub.provider,
        },
        payment_id: result.payment_id,
      },
      message: "Premium activated",
    });
  } catch (error) {
    return next(error);
  }
}

async function upsertSandboxEntitlement(req, res, next) {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_SANDBOX_ENTITLEMENTS !== "1") {
      return fail(res, {
        code: "FORBIDDEN",
        message: "Sandbox entitlement updates are disabled in production",
        status: 403,
      });
    }

    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    const sub = await Subscription.findOneAndUpdate(
      { user_id: user._id, product_id: parsed.data.product_id },
      {
        $set: {
          status: parsed.data.status,
          expires_at: parsed.data.expires_at ? new Date(parsed.data.expires_at) : undefined,
          external_id: parsed.data.external_id,
          provider: parsed.data.provider || "sandbox",
        },
        $setOnInsert: { user_id: user._id, product_id: parsed.data.product_id },
      },
      { new: true, upsert: true },
    );

    return success(res, {
      data: {
        premium: await aiQuotaService.isPremiumUser(user._id),
        subscription: {
          product_id: sub.product_id,
          status: sub.status,
          expires_at: sub.expires_at,
          provider: sub.provider,
        },
      },
      message: "Sandbox entitlement saved",
    });
  } catch (error) {
    return next(error);
  }
}

async function renderRazorpayCheckoutPage(req, res, next) {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Missing checkout token",
        status: 400,
      });
    }

    const session = verifyWebCheckoutToken(token);
    res.type("html").send(renderCheckoutHtml(session));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getEntitlement,
  createRazorpayOrder,
  verifyRazorpayPayment,
  upsertSandboxEntitlement,
  renderRazorpayCheckoutPage,
};
