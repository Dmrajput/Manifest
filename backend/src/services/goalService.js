const { Goal, UserActivity } = require("../models");

function computeGoalProgress(goal) {
  const tasks = goal.tasks || [];
  if (tasks.length === 0) return 0;
  const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
  const doneWeight = tasks
    .filter((task) => task.completed_at)
    .reduce((sum, task) => sum + (task.weight || 1), 0);
  return Math.round((doneWeight / totalWeight) * 100);
}

function serializeTask(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    due_date: task.due_date || null,
    completed_at: task.completed_at || null,
    weight: task.weight || 1,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
}

function serializeGoal(goal) {
  return {
    id: goal._id.toString(),
    title: goal.title,
    description: goal.description || null,
    target_date: goal.target_date || null,
    status: goal.status,
    cover_image: goal.cover_image || null,
    progress: computeGoalProgress(goal),
    tasks: (goal.tasks || []).map(serializeTask),
    created_at: goal.created_at,
    updated_at: goal.updated_at,
  };
}

async function listGoals(userId, { status } = {}) {
  const filter = { user_id: userId };
  if (status && status !== "all") filter.status = status;
  const docs = await Goal.find(filter).sort({ updated_at: -1 });
  return Promise.all(docs.map(serializeGoal));
}

async function getGoal(userId, goalId) {
  const goal = await Goal.findOne({ _id: goalId, user_id: userId });
  if (!goal) {
    const error = new Error("Goal not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return serializeGoal(goal);
}

async function createGoal(userId, payload) {
  const goal = await Goal.create({
    user_id: userId,
    title: payload.title,
    description: payload.description,
    target_date: payload.target_date ? new Date(payload.target_date) : undefined,
    cover_image: payload.cover_image,
    status: payload.status || "active",
    tasks: (payload.tasks || []).map((task) => ({
      title: task.title,
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      weight: task.weight || 1,
    })),
  });

  await UserActivity.create({
    user_id: userId,
    activity_type: "goal_create",
    metadata: { goal_id: goal._id.toString() },
  });

  return serializeGoal(goal);
}

async function updateGoal(userId, goalId, payload) {
  const goal = await Goal.findOne({ _id: goalId, user_id: userId });
  if (!goal) {
    const error = new Error("Goal not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (payload.title !== undefined) goal.title = payload.title;
  if (payload.description !== undefined) goal.description = payload.description;
  if (payload.cover_image !== undefined) goal.cover_image = payload.cover_image;
  if (payload.status !== undefined) goal.status = payload.status;
  if (payload.target_date !== undefined) {
    goal.target_date = payload.target_date ? new Date(payload.target_date) : null;
  }

  await goal.save();
  return serializeGoal(goal);
}

async function deleteGoal(userId, goalId) {
  const result = await Goal.findOneAndDelete({ _id: goalId, user_id: userId });
  if (!result) {
    const error = new Error("Goal not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return { id: goalId, deleted: true };
}

async function addTask(userId, goalId, payload) {
  const goal = await Goal.findOne({ _id: goalId, user_id: userId });
  if (!goal) {
    const error = new Error("Goal not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  goal.tasks.push({
    title: payload.title,
    due_date: payload.due_date ? new Date(payload.due_date) : undefined,
    weight: payload.weight || 1,
  });
  await goal.save();
  return serializeGoal(goal);
}

async function updateTask(userId, goalId, taskId, payload) {
  const goal = await Goal.findOne({ _id: goalId, user_id: userId });
  if (!goal) {
    const error = new Error("Goal not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const task = goal.tasks.id(taskId);
  if (!task) {
    const error = new Error("Task not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (payload.title !== undefined) task.title = payload.title;
  if (payload.weight !== undefined) task.weight = payload.weight;
  if (payload.due_date !== undefined) {
    task.due_date = payload.due_date ? new Date(payload.due_date) : null;
  }
  if (payload.completed !== undefined) {
    task.completed_at = payload.completed ? new Date() : null;
  }

  await goal.save();

  if (payload.completed === true) {
    await UserActivity.create({
      user_id: userId,
      activity_type: "goal_task_complete",
      metadata: { goal_id: goalId, task_id: taskId },
    });
  }

  return serializeGoal(goal);
}

async function deleteTask(userId, goalId, taskId) {
  const goal = await Goal.findOne({ _id: goalId, user_id: userId });
  if (!goal) {
    const error = new Error("Goal not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const task = goal.tasks.id(taskId);
  if (!task) {
    const error = new Error("Task not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  task.deleteOne();
  await goal.save();
  return serializeGoal(goal);
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
  serializeGoal,
  computeGoalProgress,
};
