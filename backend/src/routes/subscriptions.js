const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const subscriptionsController = require("../controllers/subscriptionsController");

const router = Router();

router.get("/entitlement", requireAuth, subscriptionsController.getEntitlement);
router.post("/razorpay/create-order", requireAuth, subscriptionsController.createRazorpayOrder);
router.post("/razorpay/verify", requireAuth, subscriptionsController.verifyRazorpayPayment);
router.post("/sandbox", requireAuth, subscriptionsController.upsertSandboxEntitlement);

module.exports = router;
