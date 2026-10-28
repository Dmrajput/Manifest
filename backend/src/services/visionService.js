const { VisionBoard, UserActivity } = require("../models");

const FREE_BOARD_LIMIT = 3;

function serializeItem(item) {
  return {
    id: item._id.toString(),
    image_path: item.image_path,
    caption: item.caption || null,
    position: item.position ?? 0,
    created_at: item.created_at,
  };
}

function serializeBoard(board) {
  const items = [...(board.items || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return {
    id: board._id.toString(),
    title: board.title,
    cover_image: board.cover_image || items[0]?.image_path || null,
    items: items.map(serializeItem),
    item_count: items.length,
    created_at: board.created_at,
    updated_at: board.updated_at,
  };
}

async function listBoards(userId) {
  const docs = await VisionBoard.find({ user_id: userId }).sort({ updated_at: -1 });
  return docs.map(serializeBoard);
}

async function getBoard(userId, boardId) {
  const board = await VisionBoard.findOne({ _id: boardId, user_id: userId });
  if (!board) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return serializeBoard(board);
}

async function createBoard(userId, payload, { premium = false } = {}) {
  if (!premium) {
    const count = await VisionBoard.countDocuments({ user_id: userId });
    if (count >= FREE_BOARD_LIMIT) {
      const error = new Error(`Free plan allows up to ${FREE_BOARD_LIMIT} vision boards. Upgrade for more.`);
      error.status = 403;
      error.code = "PREMIUM_REQUIRED";
      throw error;
    }
  }

  const board = await VisionBoard.create({
    user_id: userId,
    title: payload.title,
    cover_image: payload.cover_image,
  });

  await UserActivity.create({
    user_id: userId,
    activity_type: "vision_create",
    metadata: { board_id: board._id.toString() },
  });

  return serializeBoard(board);
}

async function updateBoard(userId, boardId, payload) {
  const board = await VisionBoard.findOne({ _id: boardId, user_id: userId });
  if (!board) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (payload.title !== undefined) board.title = payload.title;
  if (payload.cover_image !== undefined) board.cover_image = payload.cover_image;
  await board.save();
  return serializeBoard(board);
}

async function deleteBoard(userId, boardId) {
  const result = await VisionBoard.findOneAndDelete({ _id: boardId, user_id: userId });
  if (!result) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return { id: boardId, deleted: true };
}

async function addItem(userId, boardId, payload) {
  const board = await VisionBoard.findOne({ _id: boardId, user_id: userId });
  if (!board) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const position =
    payload.position !== undefined
      ? payload.position
      : board.items.reduce((max, item) => Math.max(max, item.position || 0), -1) + 1;

  board.items.push({
    image_path: payload.image_path,
    caption: payload.caption,
    position,
  });

  if (!board.cover_image) {
    board.cover_image = payload.image_path;
  }

  await board.save();
  return serializeBoard(board);
}

async function updateItem(userId, boardId, itemId, payload) {
  const board = await VisionBoard.findOne({ _id: boardId, user_id: userId });
  if (!board) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const item = board.items.id(itemId);
  if (!item) {
    const error = new Error("Vision item not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (payload.caption !== undefined) item.caption = payload.caption;
  if (payload.position !== undefined) item.position = payload.position;
  if (payload.image_path !== undefined) item.image_path = payload.image_path;

  await board.save();
  return serializeBoard(board);
}

async function deleteItem(userId, boardId, itemId) {
  const board = await VisionBoard.findOne({ _id: boardId, user_id: userId });
  if (!board) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const item = board.items.id(itemId);
  if (!item) {
    const error = new Error("Vision item not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  item.deleteOne();
  await board.save();
  return serializeBoard(board);
}

async function reorderItems(userId, boardId, orderedItemIds) {
  const board = await VisionBoard.findOne({ _id: boardId, user_id: userId });
  if (!board) {
    const error = new Error("Vision board not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const idSet = new Set(board.items.map((item) => item._id.toString()));
  for (const id of orderedItemIds) {
    if (!idSet.has(id)) {
      const error = new Error("One or more item ids are invalid for this board");
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
  }

  orderedItemIds.forEach((id, index) => {
    const item = board.items.id(id);
    if (item) item.position = index;
  });

  await board.save();
  return serializeBoard(board);
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
  FREE_BOARD_LIMIT,
};
