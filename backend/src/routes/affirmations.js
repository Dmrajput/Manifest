const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const affirmationsController = require("../controllers/affirmationsController");

const router = Router();

router.get("/", requireAuth, affirmationsController.listAffirmations);
router.post("/favorites", requireAuth, affirmationsController.saveFavorite);

module.exports = router;
