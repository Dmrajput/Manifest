const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const goalsController = require("../controllers/goalsController");

const router = Router();

router.get("/", requireAuth, goalsController.listGoals);
router.post("/", requireAuth, goalsController.createGoal);
router.get("/:id", requireAuth, goalsController.getGoal);
router.patch("/:id", requireAuth, goalsController.updateGoal);
router.delete("/:id", requireAuth, goalsController.deleteGoal);
router.post("/:id/tasks", requireAuth, goalsController.addTask);
router.patch("/:id/tasks/:taskId", requireAuth, goalsController.updateTask);
router.delete("/:id/tasks/:taskId", requireAuth, goalsController.deleteTask);

module.exports = router;
