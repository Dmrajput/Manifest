const { UserActivity, JournalEntry, PracticeSession } = require("../models");
const { getDateKeyInTimezone, shiftDateKey, normalizeTimezone } = require("../utils/timezone");

const PERIOD_TARGETS = {
  morning: 3,
  afternoon: 6,
  evening: 9,
};

const RITUAL_ACTIVITY_TYPES = [
  "journal_create",
  "journal_update",
  "practice_369",
  "practice_369_complete",
  "ai_affirmation_generate",
  "affirmation_favorite",
  "meditation_play",
];

async function collectQualifyingDateKeys(userId, timezone) {
  const tz = normalizeTimezone(timezone);
  const keys = new Set();

  const [activities, journals, sessions] = await Promise.all([
    UserActivity.find({
      user_id: userId,
      activity_type: { $in: RITUAL_ACTIVITY_TYPES },
    })
      .select({ created_at: 1 })
      .lean(),
    JournalEntry.find({ user_id: userId }).select({ created_at: 1 }).lean(),
    PracticeSession.find({ user_id: userId }).select({ date: 1, period: 1, count: 1 }).lean(),
  ]);

  for (const item of activities) {
    keys.add(getDateKeyInTimezone(item.created_at, tz));
  }
  for (const item of journals) {
    keys.add(getDateKeyInTimezone(item.created_at, tz));
  }

  // Group practice by date; any period progress counts as a ritual that day
  for (const session of sessions) {
    const key =
      session.date instanceof Date
        ? session.date.toISOString().slice(0, 10)
        : String(session.date).slice(0, 10);
    if (session.count > 0) {
      keys.add(key);
    }
  }

  return keys;
}

async function calculateStreak(userId, timezone = "UTC", now = new Date()) {
  const tz = normalizeTimezone(timezone);
  const qualifying = await collectQualifyingDateKeys(userId, tz);
  const todayKey = getDateKeyInTimezone(now, tz);
  const yesterdayKey = shiftDateKey(todayKey, -1);

  let cursor;
  if (qualifying.has(todayKey)) {
    cursor = todayKey;
  } else if (qualifying.has(yesterdayKey)) {
    // Streak still alive if yesterday qualified and today not yet
    cursor = yesterdayKey;
  } else {
    return {
      streak_days: 0,
      timezone: tz,
      today: todayKey,
      qualified_today: false,
    };
  }

  let streak = 0;
  while (qualifying.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return {
    streak_days: streak,
    timezone: tz,
    today: todayKey,
    qualified_today: qualifying.has(todayKey),
  };
}

function isPracticeDayComplete(sessionsByPeriod) {
  return (
    (sessionsByPeriod.morning?.count || 0) >= PERIOD_TARGETS.morning &&
    (sessionsByPeriod.afternoon?.count || 0) >= PERIOD_TARGETS.afternoon &&
    (sessionsByPeriod.evening?.count || 0) >= PERIOD_TARGETS.evening
  );
}

module.exports = {
  PERIOD_TARGETS,
  RITUAL_ACTIVITY_TYPES,
  calculateStreak,
  collectQualifyingDateKeys,
  isPracticeDayComplete,
};
