const { AiUsage, Subscription } = require("../models");

const FREE_DAILY_LIMIT = Number(process.env.AI_FREE_DAILY_LIMIT) || 3;
const PREMIUM_DAILY_LIMIT = Number(process.env.AI_PREMIUM_DAILY_LIMIT) || 20;

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function isPremiumUser(userId) {
  const sub = await Subscription.findOne({
    user_id: userId,
    status: { $in: ["active", "trial", "grace_period"] },
  }).sort({ updated_at: -1 });

  if (!sub) return false;
  if (sub.expires_at && sub.expires_at.getTime() < Date.now()) return false;
  return true;
}

async function getDailyUsageCount(userId, feature = "affirmations") {
  const since = startOfUtcDay();
  return AiUsage.countDocuments({
    user_id: userId,
    feature,
    created_at: { $gte: since },
  });
}

async function getQuota(userId, feature = "affirmations") {
  const premium = await isPremiumUser(userId);
  const limit = premium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const used = await getDailyUsageCount(userId, feature);
  return {
    feature,
    premium,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}

async function assertWithinQuota(userId, feature = "affirmations") {
  const quota = await getQuota(userId, feature);
  if (quota.remaining <= 0) {
    const error = new Error("Daily AI generation limit reached");
    error.status = 429;
    error.code = "AI_QUOTA_EXCEEDED";
    error.details = quota;
    throw error;
  }
  return quota;
}

async function recordUsage(userId, { feature = "affirmations", tokens = 0, estimatedCost = 0 } = {}) {
  return AiUsage.create({
    user_id: userId,
    feature,
    tokens,
    estimated_cost: estimatedCost,
  });
}

module.exports = {
  FREE_DAILY_LIMIT,
  PREMIUM_DAILY_LIMIT,
  getQuota,
  assertWithinQuota,
  recordUsage,
  isPremiumUser,
};
