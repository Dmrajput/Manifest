const {
  User,
  UserAffirmation,
  Goal,
  JournalEntry,
  VisionBoard,
  PracticeSession,
  AiConversation,
  Reminder,
  Subscription,
  AiUsage,
  UserActivity,
} = require("../models");
const { removeVisionObject } = require("./storageService");

async function deleteAccount(userId) {
  const boards = await VisionBoard.find({ user_id: userId });
  for (const board of boards) {
    for (const item of board.items || []) {
      if (item.image_path) await removeVisionObject(item.image_path);
    }
  }

  await Promise.all([
    UserAffirmation.deleteMany({ user_id: userId }),
    Goal.deleteMany({ user_id: userId }),
    JournalEntry.deleteMany({ user_id: userId }),
    VisionBoard.deleteMany({ user_id: userId }),
    PracticeSession.deleteMany({ user_id: userId }),
    AiConversation.deleteMany({ user_id: userId }),
    Reminder.deleteMany({ user_id: userId }),
    Subscription.deleteMany({ user_id: userId }),
    AiUsage.deleteMany({ user_id: userId }),
    UserActivity.deleteMany({ user_id: userId }),
  ]);

  const deleted = await User.findByIdAndDelete(userId);
  if (!deleted) {
    const error = new Error("User not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  return { deleted: true, user_id: userId.toString() };
}

module.exports = { deleteAccount };
