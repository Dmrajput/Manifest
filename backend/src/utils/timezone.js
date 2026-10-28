/**
 * Calendar date helpers in a user's IANA timezone (e.g. Asia/Kolkata).
 */

function normalizeTimezone(timezone) {
  if (!timezone || typeof timezone !== "string") return "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "UTC";
  }
}

function getDateKeyInTimezone(date = new Date(), timezone = "UTC") {
  const tz = normalizeTimezone(timezone);
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateKeyToUtcDate(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function shiftDateKey(dateKey, days) {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  normalizeTimezone,
  getDateKeyInTimezone,
  dateKeyToUtcDate,
  shiftDateKey,
};
