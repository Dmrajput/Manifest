const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const aiController = require("../controllers/aiController");
const aiCoachController = require("../controllers/aiCoachController");

const router = Router();

router.post("/affirmations", requireAuth, aiController.generateAffirmations);
router.post("/goal-plans", requireAuth, aiCoachController.generateGoalPlan);
router.get("/conversations", requireAuth, aiCoachController.listConversations);
router.post("/conversations/messages", requireAuth, aiCoachController.sendMessage);
router.get("/conversations/:id", requireAuth, aiCoachController.getConversation);
router.delete("/conversations/:id", requireAuth, aiCoachController.deleteConversation);

module.exports = router;
