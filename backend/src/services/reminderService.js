const { Reminder } = require("../models");

const DEFAULTS = [
  { type: "morning", hour: 8, minute: 0, label: "Morning affirmation" },
  { type: "evening", hour: 21, minute: 0, label: "Evening reflection" },
  { type: "practice_369", hour: 12, minute: 0, label: "369 practice" },
];

function serialize(reminder) {
  return {
    id: reminder._id.toString(),
    type: reminder.type,
    hour: reminder.hour,
    minute: reminder.minute,
    timezone: reminder.timezone || "UTC",
    enabled: Boolean(reminder.enabled),
    label: reminder.label || reminder.type,
    created_at: reminder.created_at,
    updated_at: reminder.updated_at,
  };
}

async function listReminders(userId) {
  let docs = await Reminder.find({ user_id: userId }).sort({ type: 1 });
  if (docs.length === 0) {
    docs = await Reminder.insertMany(
      DEFAULTS.map((item) => ({
        ...item,
        user_id: userId,
        enabled: true,
        time: `${String(item.hour).padStart(2, "0")}:${String(item.minute).padStart(2, "0")}`,
      }))
    );
  }
  return docs.map(serialize);
}

async function upsertReminder(userId, type, payload) {
  const update = {
    type,
    hour: payload.hour,
    minute: payload.minute ?? 0,
    enabled: payload.enabled !== undefined ? payload.enabled : true,
    timezone: payload.timezone || "UTC",
    label: payload.label,
    time: `${String(payload.hour).padStart(2, "0")}:${String(payload.minute ?? 0).padStart(2, "0")}`,
  };

  const doc = await Reminder.findOneAndUpdate(
    { user_id: userId, type },
    { $set: update, $setOnInsert: { user_id: userId } },
    { new: true, upsert: true, runValidators: true }
  );
  return serialize(doc);
}

async function deleteReminder(userId, type) {
  const result = await Reminder.findOneAndDelete({ user_id: userId, type });
  if (!result) {
    const error = new Error("Reminder not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return { type, deleted: true };
}

module.exports = { listReminders, upsertReminder, deleteReminder, DEFAULTS };
