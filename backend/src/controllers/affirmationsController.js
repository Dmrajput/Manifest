const { success, fail } = require("../utils/response");
const userService = require("../services/userService");
const affirmationService = require("../services/affirmationService");
const { favoriteSchema } = require("../validators/affirmations");

async function listAffirmations(req, res, next) {
  try {
    const user = await userService.getOrCreateFromAuth(req.auth);
    const favoritesOnly = req.query.favoritesOnly === "true" || req.query.favorites === "1";
    const items = await affirmationService.listAffirmations(user._id, {
      category: req.query.category,
      language: req.query.language,
      favoritesOnly,
    });
    return success(res, {
      data: { affirmations: items },
      message: "Affirmations loaded",
    });
  } catch (error) {
    return next(error);
  }
}

async function listCategories(req, res, next) {
  try {
    await userService.getOrCreateFromAuth(req.auth);
    const categories = await affirmationService.listCategories();
    return success(res, {
      data: { categories },
      message: "Affirmation categories loaded",
    });
  } catch (error) {
    return next(error);
  }
}

async function saveFavorite(req, res, next) {
  try {
    const parsed = favoriteSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const user = await userService.getOrCreateFromAuth(req.auth);
    const result = await affirmationService.setFavorite(
      user._id,
      parsed.data.affirmation_id,
      parsed.data.is_favorite
    );

    return success(res, {
      data: result,
      message: result.is_favorite ? "Affirmation saved" : "Affirmation unsaved",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAffirmations, listCategories, saveFavorite };
