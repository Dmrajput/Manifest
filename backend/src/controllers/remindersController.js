const { z } = require("zod");
const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const reminderService = require("../services/reminderService");

const upsertSchema = z.object({
  type: z.enum(["morning", "evening", "practice_369"]),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional(),
  enabled: z.boolean().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  label: z.string().trim().max(120).optional(),
});

async function listReminders(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const reminders = await reminderService.listReminders(user._id);
    return success(res, { data: { reminders }, message: "Reminders loaded" });
  } catch (error) {
    return next(error);
  }
}

async function upsertReminder(req, res, next) {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const reminder = await reminderService.upsertReminder(user._id, parsed.data.type, {
      ...parsed.data,
      timezone: parsed.data.timezone || user.timezone,
    });
    return success(res, { data: { reminder }, message: "Reminder saved" });
  } catch (error) {
    return next(error);
  }
}

async function deleteReminder(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await reminderService.deleteReminder(user._id, req.params.type);
    return success(res, { data: result, message: "Reminder deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listReminders, upsertReminder, deleteReminder };
