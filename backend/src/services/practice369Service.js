const { PracticeSession, UserActivity } = require("../models");
const { getDateKeyInTimezone, dateKeyToUtcDate, normalizeTimezone } = require("../utils/timezone");
const { PERIOD_TARGETS, isPracticeDayComplete } = require("./streakService");

function serializeSession(session) {
  const period = session.period;
  const target = PERIOD_TARGETS[period];
  return {
    id: session._id.toString(),
    date: session.date.toISOString().slice(0, 10),
    period,
    count: session.count,
    target,
    complete: session.count >= target,
    content: session.content || null,
    updated_at: session.updated_at,
  };
}

async function getTodayProgress(userId, timezone = "UTC", now = new Date()) {
  const tz = normalizeTimezone(timezone);
  const dateKey = getDateKeyInTimezone(now, tz);
  const date = dateKeyToUtcDate(dateKey);

  const sessions = await PracticeSession.find({ user_id: userId, date });
  const byPeriod = {
    morning: null,
    afternoon: null,
    evening: null,
  };

  for (const session of sessions) {
    byPeriod[session.period] = serializeSession(session);
  }

  const periods = ["morning", "afternoon", "evening"].map((period) => {
    if (byPeriod[period]) return byPeriod[period];
    return {
      id: null,
      date: dateKey,
      period,
      count: 0,
      target: PERIOD_TARGETS[period],
      complete: false,
      content: null,
      updated_at: null,
    };
  });

  const dayComplete = periods.every((item) => item.complete);

  return {
    date: dateKey,
    timezone: tz,
    periods,
    day_complete: dayComplete,
    targets: PERIOD_TARGETS,
  };
}

async function recordPractice(userId, { period, count, content, timezone = "UTC" }, now = new Date()) {
  if (!PERIOD_TARGETS[period]) {
    const error = new Error("Invalid practice period");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const tz = normalizeTimezone(timezone);
  const dateKey = getDateKeyInTimezone(now, tz);
  const date = dateKeyToUtcDate(dateKey);
  const target = PERIOD_TARGETS[period];
  const nextCount = Math.min(Math.max(Number(count) || 0, 0), target);

  const session = await PracticeSession.findOneAndUpdate(
    { user_id: userId, date, period },
    {
      $set: {
        count: nextCount,
        ...(content !== undefined ? { content } : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await UserActivity.create({
    user_id: userId,
    activity_type: "practice_369",
    metadata: { period, count: session.count, date: dateKey },
  });

  const today = await getTodayProgress(userId, tz, now);
  if (today.day_complete) {
    const alreadyLogged = await UserActivity.exists({
      user_id: userId,
      activity_type: "practice_369_complete",
      "metadata.date": dateKey,
    });
    if (!alreadyLogged) {
      await UserActivity.create({
        user_id: userId,
        activity_type: "practice_369_complete",
        metadata: { date: dateKey },
      });
    }
  }

  return {
    session: serializeSession(session),
    today,
  };
}

module.exports = {
  PERIOD_TARGETS,
  getTodayProgress,
  recordPractice,
  serializeSession,
  isPracticeDayComplete,
};
