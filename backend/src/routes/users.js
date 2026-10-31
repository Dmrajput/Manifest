const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const usersController = require("../controllers/usersController");

const router = Router();

router.get("/me", requireAuth, usersController.getMe);
router.patch("/me", requireAuth, usersController.patchMe);
router.delete("/me", requireAuth, usersController.deleteMe);

module.exports = router;
