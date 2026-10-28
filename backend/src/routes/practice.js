const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const practice369Controller = require("../controllers/practice369Controller");

const router = Router();

router.get("/369/today", requireAuth, practice369Controller.getToday);
router.post("/369", requireAuth, practice369Controller.record);

module.exports = router;
