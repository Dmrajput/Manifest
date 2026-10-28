const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const progressController = require("../controllers/progressController");

const router = Router();

router.get("/", requireAuth, progressController.getProgress);

module.exports = router;
