const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const meditationController = require("../controllers/meditationController");

const router = Router();

router.get("/", requireAuth, meditationController.listTracks);
router.get("/:id", requireAuth, meditationController.getTrack);

module.exports = router;
