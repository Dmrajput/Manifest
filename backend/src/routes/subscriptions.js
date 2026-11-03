const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const subscriptionsController = require("../controllers/subscriptionsController");

const router = Router();

router.get("/entitlement", requireAuth, subscriptionsController.getEntitlement);
router.get("/razorpay/status", subscriptionsController.getRazorpayPublicStatus);
router.post("/razorpay/create-order", requireAuth, subscriptionsController.createRazorpayOrder);
router.post("/razorpay/verify", requireAuth, subscriptionsController.verifyRazorpayPayment);
router.get("/razorpay/checkout", subscriptionsController.renderRazorpayCheckoutPage);
router.post("/sandbox", requireAuth, subscriptionsController.upsertSandboxEntitlement);

module.exports = router;
