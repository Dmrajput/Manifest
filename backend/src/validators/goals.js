const { z } = require("zod");

const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  target_date: z.union([z.string().datetime(), z.string().min(4).max(32), z.null()]).optional(),
  cover_image: z.union([z.string().url(), z.string().trim().max(500), z.null()]).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        due_date: z.string().optional().nullable(),
        weight: z.number().int().min(1).max(100).optional(),
      })
    )
    .optional(),
});

const updateGoalSchema = createGoalSchema.partial();

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  due_date: z.string().optional().nullable(),
  weight: z.number().int().min(1).max(100).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  due_date: z.string().optional().nullable(),
  weight: z.number().int().min(1).max(100).optional(),
  completed: z.boolean().optional(),
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
  createTaskSchema,
  updateTaskSchema,
};
