const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const practice369Service = require("../services/practice369Service");
const { recordPracticeSchema } = require("../validators/practice369");

async function getToday(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const today = await practice369Service.getTodayProgress(user._id, user.timezone);
    return success(res, { data: today, message: "369 practice progress loaded" });
  } catch (error) {
    return next(error);
  }
}

async function record(req, res, next) {
  try {
    const parsed = recordPracticeSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await practice369Service.recordPractice(user._id, {
      ...parsed.data,
      timezone: user.timezone,
    });

    return success(res, { data: result, message: "369 practice recorded" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getToday, record };
