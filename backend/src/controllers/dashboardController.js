const { success } = require("../utils/response");
const userService = require("../services/userService");
const dashboardService = require("../services/dashboardService");

async function getDashboard(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const data = await dashboardService.getDashboard(user);
    return success(res, { data, message: "Dashboard loaded" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDashboard };
