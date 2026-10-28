const { z } = require("zod");

const favoriteSchema = z
  .object({
    affirmation_id: z.string().min(1),
    is_favorite: z.boolean().optional().default(true),
  })
  .strict();

const generateAffirmationsSchema = z
  .object({
    goal: z.string().trim().max(200).optional(),
    category: z.string().trim().max(40).optional(),
    language: z.string().trim().min(2).max(10).optional().default("en"),
    tone: z.string().trim().max(40).optional().default("encouraging"),
    count: z.number().int().min(3).max(10).optional().default(5),
    save: z.boolean().optional().default(true),
  })
  .strict();

module.exports = { favoriteSchema, generateAffirmationsSchema };
