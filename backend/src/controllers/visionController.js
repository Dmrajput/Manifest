const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const visionService = require("../services/visionService");
const { Subscription } = require("../models");
const {
  createBoardSchema,
  updateBoardSchema,
  addItemSchema,
  updateItemSchema,
  reorderItemsSchema,
} = require("../validators/vision");

async function isPremiumUser(userId) {
  const sub = await Subscription.findOne({
    user_id: userId,
    status: { $in: ["active", "trial", "grace_period"] },
  }).sort({ updated_at: -1 });
  return Boolean(sub);
}

async function listBoards(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const boards = await visionService.listBoards(user._id);
    return success(res, { data: { boards }, message: "Vision boards loaded" });
  } catch (error) {
    return next(error);
  }
}

async function getBoard(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const board = await visionService.getBoard(user._id, req.params.id);
    return success(res, { data: { board }, message: "Vision board loaded" });
  } catch (error) {
    return next(error);
  }
}

async function createBoard(req, res, next) {
  try {
    const parsed = createBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const premium = await isPremiumUser(user._id);
    const board = await visionService.createBoard(user._id, parsed.data, { premium });
    return success(res, { data: { board }, message: "Vision board created", status: 201 });
  } catch (error) {
    return next(error);
  }
}

async function updateBoard(req, res, next) {
  try {
    const parsed = updateBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const board = await visionService.updateBoard(user._id, req.params.id, parsed.data);
    return success(res, { data: { board }, message: "Vision board updated" });
  } catch (error) {
    return next(error);
  }
}

async function deleteBoard(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await visionService.deleteBoard(user._id, req.params.id);
    return success(res, { data: result, message: "Vision board deleted" });
  } catch (error) {
    return next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const board = await visionService.addItem(user._id, req.params.id, parsed.data);
    return success(res, { data: { board }, message: "Item added", status: 201 });
  } catch (error) {
    return next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const board = await visionService.updateItem(user._id, req.params.id, req.params.itemId, parsed.data);
    return success(res, { data: { board }, message: "Item updated" });
  } catch (error) {
    return next(error);
  }
}

async function deleteItem(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const board = await visionService.deleteItem(user._id, req.params.id, req.params.itemId);
    return success(res, { data: { board }, message: "Item deleted" });
  } catch (error) {
    return next(error);
  }
}

async function reorderItems(req, res, next) {
  try {
    const parsed = reorderItemsSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const board = await visionService.reorderItems(user._id, req.params.id, parsed.data.ordered_item_ids);
    return success(res, { data: { board }, message: "Items reordered" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
};
