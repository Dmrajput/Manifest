const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const affirmationsController = require("../controllers/affirmationsController");

const router = Router();

router.get("/categories", requireAuth, affirmationsController.listCategories);
router.get("/", requireAuth, affirmationsController.listAffirmations);
router.post("/favorites", requireAuth, affirmationsController.saveFavorite);
router.put("/favorites/notification", requireAuth, affirmationsController.saveFavoriteNotification);

module.exports = router;
