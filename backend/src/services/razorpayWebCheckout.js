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
  const plan = session.plan === "yearly" ? "yearly" : "monthly";
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
  p { line-height: 1.5; margin: 0 0 12px; }
  #status { font-size: 14px; color: #c4b5fd; min-height: 20px; margin-bottom: 8px; }
  button { background: #7c3aed; color: #fff; border: 0; padding: 14px 20px; border-radius: 12px; font-size: 16px; width: 100%; margin-top: 8px; }
  button:disabled { opacity: 0.55; }
</style>
</head><body>
<p>Complete your premium payment securely with Razorpay.</p>
<p id="status">Loading Razorpay…</p>
<button type="button" id="pay" disabled>Continue to payment</button>
<script>
  var PLAN = ${JSON.stringify(plan)};
  var options = ${payload};

  function post(obj) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
    } catch (e) {}
  }

  function setStatus(text) {
    var el = document.getElementById("status");
    if (el) el.textContent = text;
    post({ type: "status", message: text });
  }

  function finishSuccess(response) {
    post({
      type: "success",
      plan: PLAN,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature
    });
    var q = new URLSearchParams({
      plan: PLAN,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature
    });
    window.location.href = "manifestly://premium/razorpay?" + q.toString();
  }

  options.handler = finishSuccess;
  options.modal = {
    ondismiss: function () {
      post({ type: "cancel" });
      setStatus("Payment closed. Tap the button to try again.");
      document.getElementById("pay").disabled = false;
    }
  };

  function openCheckout() {
    var btn = document.getElementById("pay");
    if (typeof Razorpay === "undefined") {
      setStatus("Razorpay is still loading. Wait a moment and try again.");
      post({ type: "error", message: "Razorpay checkout script not loaded yet." });
      return;
    }
    btn.disabled = true;
    setStatus("Opening payment…");
    try {
      var rzp = new Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        btn.disabled = false;
        var msg = (resp.error && resp.error.description) || "Payment failed";
        setStatus(msg);
        post({ type: "error", message: msg });
      });
      rzp.open();
      setStatus("Complete payment in the Razorpay window.");
    } catch (e) {
      btn.disabled = false;
      var err = String(e.message || e);
      setStatus(err);
      post({ type: "error", message: err });
    }
  }

  function boot() {
    var btn = document.getElementById("pay");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openCheckout();
    });

    if (window.Razorpay) {
      btn.disabled = false;
      setStatus("Ready. Tap continue to pay.");
      return;
    }

    var script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = function () {
      btn.disabled = false;
      setStatus("Ready. Tap continue to pay.");
    };
    script.onerror = function () {
      setStatus("Could not load Razorpay. Check internet and try again.");
      post({ type: "error", message: "Could not load Razorpay checkout script." });
    };
    document.head.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
</script>
</body></html>`;
}

module.exports = {
  signWebCheckoutToken,
  verifyWebCheckoutToken,
  buildWebCheckoutUrl,
  renderCheckoutHtml,
};
