const { z } = require("zod");

const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional().nullable(),
    avatar: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    onboarding_completed: z.boolean().optional(),
    preferences: z
      .object({
        categories: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
        language: z.string().trim().min(2).max(10).optional(),
        theme: z.enum(["system", "light", "dark"]).optional(),
      })
      .optional(),
  })
  .strict();

module.exports = { updateMeSchema };
