const { z } = require("zod");

const recordPracticeSchema = z
  .object({
    period: z.enum(["morning", "afternoon", "evening"]),
    count: z.number().int().min(0).max(9),
    content: z.string().trim().max(5000).optional().nullable(),
  })
  .strict();

module.exports = { recordPracticeSchema };
