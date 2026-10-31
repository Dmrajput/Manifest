const { z } = require("zod");
const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const aiCoachService = require("../services/aiCoachService");
const goalService = require("../services/goalService");

const sendSchema = z.object({
  conversation_id: z.string().optional().nullable(),
  message: z.string().trim().min(1).max(4000),
});

const planSchema = z.object({
  goal_id: z.string().optional(),
  goal_title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  weeks: z.number().int().min(1).max(8).optional(),
  save: z.boolean().optional(),
});

async function listConversations(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const conversations = await aiCoachService.listConversations(user._id);
    return success(res, { data: { conversations }, message: "Conversations loaded" });
  } catch (error) {
    return next(error);
  }
}

async function getConversation(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const conversation = await aiCoachService.getConversation(user._id, req.params.id);
    return success(res, { data: { conversation }, message: "Conversation loaded" });
  } catch (error) {
    return next(error);
  }
}

async function deleteConversation(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await aiCoachService.deleteConversation(user._id, req.params.id);
    return success(res, { data: result, message: "Conversation deleted" });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await aiCoachService.sendMessage(user._id, {
      conversationId: parsed.data.conversation_id,
      message: parsed.data.message,
    });
    return success(res, { data: result, message: "Message sent" });
  } catch (error) {
    return next(error);
  }
}

async function generateGoalPlan(req, res, next) {
  try {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    let goalTitle = parsed.data.goal_title;
    let description = parsed.data.description;

    if (parsed.data.goal_id) {
      const goal = await goalService.getGoal(user._id, parsed.data.goal_id);
      goalTitle = goal.title;
      description = goal.description;
    }

    if (!goalTitle) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "goal_title or goal_id is required",
        status: 400,
      });
    }

    const plan = await aiCoachService.generateGoalPlan(user._id, {
      goalTitle,
      description,
      weeks: parsed.data.weeks,
    });

    let goal = null;
    if (parsed.data.save && parsed.data.goal_id) {
      const existing = await goalService.getGoal(user._id, parsed.data.goal_id);
      const existingTitles = new Set((existing.tasks || []).map((t) => t.title.toLowerCase()));
      for (const task of plan.tasks) {
        if (!existingTitles.has(task.title.toLowerCase())) {
          goal = await goalService.addTask(user._id, parsed.data.goal_id, task);
          existingTitles.add(task.title.toLowerCase());
        }
      }
      if (!goal) goal = existing;
    }

    return success(res, {
      data: { plan, goal },
      message: parsed.data.save ? "Plan generated and tasks saved" : "Plan generated",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  generateGoalPlan,
};
