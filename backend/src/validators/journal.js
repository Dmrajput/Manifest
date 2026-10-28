const { z } = require("zod");

const createJournalSchema = z
  .object({
    content: z.string().trim().min(1).max(10000),
    type: z.enum(["gratitude", "free_write", "future_self"]).optional().default("free_write"),
    mood: z.number().int().min(1).max(5).optional().nullable(),
    image_path: z.string().max(500).optional().nullable(),
  })
  .strict();

const updateJournalSchema = z
  .object({
    content: z.string().trim().min(1).max(10000).optional(),
    type: z.enum(["gratitude", "free_write", "future_self"]).optional(),
    mood: z.number().int().min(1).max(5).optional().nullable(),
    image_path: z.string().max(500).optional().nullable(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field required" });

module.exports = { createJournalSchema, updateJournalSchema };
