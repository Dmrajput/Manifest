const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const remindersController = require("../controllers/remindersController");

const router = Router();

router.get("/", requireAuth, remindersController.listReminders);
router.put("/", requireAuth, remindersController.upsertReminder);
router.delete("/:type", requireAuth, remindersController.deleteReminder);

module.exports = router;
