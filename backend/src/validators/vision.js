const { z } = require("zod");

const createBoardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  cover_image: z.string().trim().max(1000).optional().nullable(),
});

const updateBoardSchema = createBoardSchema.partial();

const addItemSchema = z.object({
  image_path: z.string().trim().min(1).max(1000),
  caption: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().min(0).optional(),
});

const updateItemSchema = z.object({
  caption: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().min(0).optional(),
  image_path: z.string().trim().min(1).max(1000).optional(),
});

const reorderItemsSchema = z.object({
  ordered_item_ids: z.array(z.string().min(1)).min(1),
});

module.exports = {
  createBoardSchema,
  updateBoardSchema,
  addItemSchema,
  updateItemSchema,
  reorderItemsSchema,
};
