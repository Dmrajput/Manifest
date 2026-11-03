const jwt = require("jsonwebtoken");

function getCheckoutTokenSecret() {
  return (
    process.env.RAZORPAY_CHECKOUT_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim() ||
    ""
  );
}

function signWebCheckoutToken(payload) {
  const secret = getCheckoutTokenSecret();
  if (!secret) {
    const error = new Error("Checkout token secret is not configured");
    error.status = 503;
    error.code = "CHECKOUT_NOT_CONFIGURED";
    throw error;
  }

  return jwt.sign(
    {
      plan: payload.plan,
      order_id: payload.order_id,
      amount: payload.amount,
      key_id: payload.key_id,
      description: payload.description,
      product_id: payload.product_id,
      prefill: payload.prefill || {},
    },
    secret,
    { algorithm: "HS256", expiresIn: "20m" },
  );
}

function verifyWebCheckoutToken(token) {
  const secret = getCheckoutTokenSecret();
  if (!secret) {
    const error = new Error("Checkout token secret is not configured");
    error.status = 503;
    error.code = "CHECKOUT_NOT_CONFIGURED";
    throw error;
  }

  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    const error = new Error("Invalid or expired checkout link");
    error.status = 400;
    error.code = "CHECKOUT_TOKEN_INVALID";
    throw error;
  }
}

function resolveApiPublicBase(req) {
  const configured = process.env.API_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (configured) {
    return configured;
  }
  const host = req.get("x-forwarded-host") || req.get("host");
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function buildWebCheckoutUrl(req, token) {
  const base = resolveApiPublicBase(req);
  return `${base}/api/v1/subscriptions/razorpay/checkout?token=${encodeURIComponent(token)}`;
}

function renderCheckoutHtml(session) {
  const options = {
    key: session.key_id,
    amount: session.amount,
    currency: "INR",
    name: "Manifestly AI",
    description: session.description,
    order_id: session.order_id,
    prefill: session.prefill || {},
    theme: { color: "#7C3AED" },
  };
  const payload = JSON.stringify(options).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>Manifestly Premium</title>
<style>
  body { font-family: system-ui, sans-serif; background: #1a1028; color: #f5f0ff; margin: 0; padding: 24px; }
  p { line-height: 1.5; }
  button { background: #7c3aed; color: #fff; border: 0; padding: 14px 20px; border-radius: 12px; font-size: 16px; width: 100%; margin-top: 16px; }
</style>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head><body>
<p>Complete your premium payment securely with Razorpay.</p>
<button type="button" id="pay">Continue to payment</button>
<script>
  function post(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(JSON.stringify(obj), "*");
    }
  }
  var options = ${payload};
  options.handler = function (response) {
    post({
      type: "success",
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature
    });
  };
  options.modal = {
    ondismiss: function () {
      post({ type: "cancel" });
    }
  };
  function openCheckout() {
    if (typeof Razorpay === "undefined") {
      post({ type: "error", message: "Could not load Razorpay checkout. Check your internet connection." });
      return;
    }
    try {
      var rzp = new Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        post({
          type: "error",
          message: (resp.error && resp.error.description) || "Payment failed"
        });
      });
      rzp.open();
    } catch (e) {
      post({ type: "error", message: String(e.message || e) });
    }
  }
  document.getElementById("pay").onclick = openCheckout;
  setTimeout(openCheckout, 300);
</script>
</body></html>`;
}

module.exports = {
  signWebCheckoutToken,
  verifyWebCheckoutToken,
  buildWebCheckoutUrl,
  renderCheckoutHtml,
};
