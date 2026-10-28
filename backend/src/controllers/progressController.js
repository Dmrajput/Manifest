const { success } = require("../utils/response");
const userService = require("../services/userService");
const streakService = require("../services/streakService");

async function getProgress(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const streak = await streakService.calculateStreak(user._id, user.timezone);
    return success(res, {
      data: {
        streak,
      },
      message: "Progress loaded",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProgress };
