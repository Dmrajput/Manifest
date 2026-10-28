const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const affirmationService = require("../services/affirmationService");
const aiAffirmationService = require("../services/aiAffirmationService");
const aiQuotaService = require("../services/aiQuotaService");
const { generateAffirmationsSchema } = require("../validators/affirmations");
const { UserActivity } = require("../models");

async function generateAffirmations(req, res, next) {
  try {
    const parsed = generateAffirmationsSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    const quotaBefore = await aiQuotaService.assertWithinQuota(user._id, "affirmations");

    const generated = await aiAffirmationService.generateAffirmations(parsed.data);
    let affirmations = generated.affirmations;

    if (parsed.data.save !== false) {
      affirmations = await affirmationService.saveGeneratedAffirmations(affirmations);
    }

    await aiQuotaService.recordUsage(user._id, {
      feature: "affirmations",
      tokens: generated.tokens,
      estimatedCost: generated.estimatedCost,
    });

    await UserActivity.create({
      user_id: user._id,
      activity_type: "ai_affirmation_generate",
      metadata: { count: affirmations.length, provider: generated.provider },
    });

    const quota = await aiQuotaService.getQuota(user._id, "affirmations");

    return success(res, {
      data: {
        affirmations,
        provider: generated.provider,
        quota,
        quota_before: quotaBefore,
      },
      message: "Affirmations generated",
    });
  } catch (error) {
    if (error.code === "AI_QUOTA_EXCEEDED") {
      return fail(res, {
        code: error.code,
        message: error.message,
        status: 429,
        details: error.details,
      });
    }
    return next(error);
  }
}

module.exports = { generateAffirmations };
