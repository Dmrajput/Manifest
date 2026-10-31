const { success, fail } = require("../utils/response");
const { updateMeSchema } = require("../validators/users");
const userService = require("../services/userService");

async function getMe(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    return success(res, {
      data: { user: userService.serializeUser(user) },
      message: "Profile loaded",
    });
  } catch (error) {
    return next(error);
  }
}

async function patchMe(req, res, next) {
  try {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const existing = await userService.getOrCreateFromAuth(req.auth);
    const user = await userService.updateMe(existing._id, parsed.data);

    return success(res, {
      data: { user: userService.serializeUser(user) },
      message: "Profile updated",
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMe(req, res, next) {
  try {
    const accountService = require("../services/accountService");
    const existing = await userService.getOrCreateFromAuth(req.auth);
    const result = await accountService.deleteAccount(existing._id);
    return success(res, { data: result, message: "Account deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMe, patchMe, deleteMe };
