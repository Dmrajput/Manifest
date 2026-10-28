const { Goal, JournalEntry, VisionBoard } = require("../models");
const affirmationService = require("./affirmationService");
const aiQuotaService = require("./aiQuotaService");
const streakService = require("./streakService");
const { computeGoalProgress } = require("./goalService");
const { getDateKeyInTimezone, dateKeyToUtcDate, shiftDateKey } = require("../utils/timezone");

function greetingForHour(hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

async function getDashboard(user) {
  const timezone = user.timezone || "UTC";
  const todayKey = getDateKeyInTimezone(new Date(), timezone);
  const todayStart = dateKeyToUtcDate(todayKey);
  const tomorrowStart = dateKeyToUtcDate(shiftDateKey(todayKey, 1));
  const categories = user.preferences?.categories || [];

  const [affirmation, journalToday, visionCount, goals, quota, streak] = await Promise.all([
    affirmationService.pickAffirmationOfTheDay(user._id, categories),
    JournalEntry.exists({
      user_id: user._id,
      created_at: { $gte: todayStart, $lt: tomorrowStart },
    }),
    VisionBoard.countDocuments({ user_id: user._id }),
    Goal.find({ user_id: user._id, status: "active" }).sort({ updated_at: -1 }).limit(1),
    aiQuotaService.getQuota(user._id, "affirmations"),
    streakService.calculateStreak(user._id, timezone),
  ]);

  const activeGoalDoc = goals[0] || null;
  let activeGoal = null;
  if (activeGoalDoc) {
    activeGoal = {
      id: activeGoalDoc._id.toString(),
      title: activeGoalDoc.title,
      progress: computeGoalProgress(activeGoalDoc),
      target_date: activeGoalDoc.target_date || null,
    };
  }

  const rituals = {
    affirmation: Boolean(affirmation),
    journal: Boolean(journalToday),
    vision: visionCount > 0,
    meditation: false,
  };

  const completedRituals = Object.values(rituals).filter(Boolean).length;

  return {
    greeting: greetingForHour(new Date().getHours()),
    user: {
      id: user._id.toString(),
      name: user.name || null,
      email: user.email,
      timezone,
    },
    affirmation_of_the_day: affirmation,
    rituals,
    rituals_completed: completedRituals,
    rituals_total: 4,
    streak_days: streak.streak_days,
    streak,
    active_goal: activeGoal,
    ai_quota: quota,
  };
}

module.exports = { getDashboard, greetingForHour, computeGoalProgress };
