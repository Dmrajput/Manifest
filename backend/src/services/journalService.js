const { JournalEntry, UserActivity } = require("../models");

function serializeEntry(entry) {
  return {
    id: entry._id.toString(),
    content: entry.content,
    type: entry.type,
    mood: entry.mood ?? null,
    image_path: entry.image_path || null,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}

async function listEntries(userId, { type, limit = 50 } = {}) {
  const filter = { user_id: userId };
  if (type) filter.type = type;
  const docs = await JournalEntry.find(filter)
    .sort({ created_at: -1 })
    .limit(Math.min(Number(limit) || 50, 100));
  return docs.map(serializeEntry);
}

async function createEntry(userId, payload) {
  const entry = await JournalEntry.create({
    user_id: userId,
    content: payload.content,
    type: payload.type || "free_write",
    mood: payload.mood,
    image_path: payload.image_path,
  });

  await UserActivity.create({
    user_id: userId,
    activity_type: "journal_create",
    metadata: { entry_id: entry._id.toString(), type: entry.type },
  });

  return serializeEntry(entry);
}

async function updateEntry(userId, entryId, payload) {
  const entry = await JournalEntry.findOne({ _id: entryId, user_id: userId });
  if (!entry) {
    const error = new Error("Journal entry not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (payload.content !== undefined) entry.content = payload.content;
  if (payload.type !== undefined) entry.type = payload.type;
  if (payload.mood !== undefined) entry.mood = payload.mood;
  if (payload.image_path !== undefined) entry.image_path = payload.image_path;

  await entry.save();

  await UserActivity.create({
    user_id: userId,
    activity_type: "journal_update",
    metadata: { entry_id: entry._id.toString() },
  });

  return serializeEntry(entry);
}

async function deleteEntry(userId, entryId) {
  const result = await JournalEntry.findOneAndDelete({ _id: entryId, user_id: userId });
  if (!result) {
    const error = new Error("Journal entry not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return { id: entryId, deleted: true };
}

module.exports = {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  serializeEntry,
};
