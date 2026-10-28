const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const visionController = require("../controllers/visionController");

const router = Router();

router.get("/", requireAuth, visionController.listBoards);
router.post("/", requireAuth, visionController.createBoard);
router.get("/:id", requireAuth, visionController.getBoard);
router.patch("/:id", requireAuth, visionController.updateBoard);
router.delete("/:id", requireAuth, visionController.deleteBoard);
router.post("/:id/items/reorder", requireAuth, visionController.reorderItems);
router.post("/:id/items", requireAuth, visionController.addItem);
router.patch("/:id/items/:itemId", requireAuth, visionController.updateItem);
router.delete("/:id/items/:itemId", requireAuth, visionController.deleteItem);

module.exports = router;
