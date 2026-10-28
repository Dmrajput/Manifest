const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const journalService = require("../services/journalService");
const { createJournalSchema, updateJournalSchema } = require("../validators/journal");

async function listJournal(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const entries = await journalService.listEntries(user._id, {
      type: req.query.type,
      limit: req.query.limit,
    });
    return success(res, { data: { entries }, message: "Journal entries loaded" });
  } catch (error) {
    return next(error);
  }
}

async function createJournal(req, res, next) {
  try {
    const parsed = createJournalSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const entry = await journalService.createEntry(user._id, parsed.data);
    return success(res, { data: { entry }, message: "Journal entry created", status: 201 });
  } catch (error) {
    return next(error);
  }
}

async function updateJournal(req, res, next) {
  try {
    const parsed = updateJournalSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }
    const user = await userService.getOrCreateFromAuth(req.auth);
    const entry = await journalService.updateEntry(user._id, req.params.id, parsed.data);
    return success(res, { data: { entry }, message: "Journal entry updated" });
  } catch (error) {
    return next(error);
  }
}

async function deleteJournal(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await journalService.deleteEntry(user._id, req.params.id);
    return success(res, { data: result, message: "Journal entry deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listJournal, createJournal, updateJournal, deleteJournal };
