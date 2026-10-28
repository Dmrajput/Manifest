const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const journalController = require("../controllers/journalController");

const router = Router();

router.get("/", requireAuth, journalController.listJournal);
router.post("/", requireAuth, journalController.createJournal);
router.patch("/:id", requireAuth, journalController.updateJournal);
router.delete("/:id", requireAuth, journalController.deleteJournal);

module.exports = router;
