const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const goalService = require("../services/goalService");
const {
  createGoalSchema,
  updateGoalSchema,
  createTaskSchema,
  updateTaskSchema,
} = require("../validators/goals");

async function listGoals(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goals = await goalService.listGoals(user._id, { status: req.query.status });
    return success(res, { data: { goals }, message: "Goals loaded" });
  } catch (error) {
    return next(error);
  }
}

async function getGoal(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goal = await goalService.getGoal(user._id, req.params.id);
    return success(res, { data: { goal }, message: "Goal loaded" });
  } catch (error) {
    return next(error);
  }
}

async function createGoal(req, res, next) {
  try {
    const parsed = createGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goal = await goalService.createGoal(user._id, parsed.data);
    return success(res, { data: { goal }, message: "Goal created", status: 201 });
  } catch (error) {
    return next(error);
  }
}

async function updateGoal(req, res, next) {
  try {
    const parsed = updateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goal = await goalService.updateGoal(user._id, req.params.id, parsed.data);
    return success(res, { data: { goal }, message: "Goal updated" });
  } catch (error) {
    return next(error);
  }
}

async function deleteGoal(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await goalService.deleteGoal(user._id, req.params.id);
    return success(res, { data: result, message: "Goal deleted" });
  } catch (error) {
    return next(error);
  }
}

async function addTask(req, res, next) {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goal = await goalService.addTask(user._id, req.params.id, parsed.data);
    return success(res, { data: { goal }, message: "Task added", status: 201 });
  } catch (error) {
    return next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goal = await goalService.updateTask(user._id, req.params.id, req.params.taskId, parsed.data);
    return success(res, { data: { goal }, message: "Task updated" });
  } catch (error) {
    return next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const goal = await goalService.deleteTask(user._id, req.params.id, req.params.taskId);
    return success(res, { data: { goal }, message: "Task deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addTask,
  updateTask,
  deleteTask,
};
