const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const aiController = require("../controllers/aiController");

const router = Router();

router.post("/affirmations", requireAuth, aiController.generateAffirmations);

module.exports = router;
