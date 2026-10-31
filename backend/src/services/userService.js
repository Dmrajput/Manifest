const { User } = require("../models");

function serializeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || null,
    avatar: user.avatar || null,
    timezone: user.timezone || "UTC",
    authProviderId: user.authProviderId,
    preferences: {
      categories: user.preferences?.categories || [],
      language: user.preferences?.language || "en",
      theme: user.preferences?.theme || "system",
      notifications: {
        morning: user.preferences?.notifications?.morning !== false,
        evening: user.preferences?.notifications?.evening !== false,
        practice369: user.preferences?.notifications?.practice369 !== false,
      },
    },
    onboarding_completed: Boolean(user.onboarding_completed),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function getOrCreateFromAuth(auth) {
  if (!auth?.id) {
    const error = new Error("Auth subject required");
    error.status = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }

  let user = await User.findOne({ authProviderId: auth.id });

  if (!user && auth.email) {
    user = await User.findOne({ email: auth.email.toLowerCase() });
    if (user && !user.authProviderId) {
      user.authProviderId = auth.id;
      await user.save();
    }
  }

  if (!user) {
    if (!auth.email) {
      const error = new Error("Email claim required to create user");
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    user = await User.create({
      email: auth.email.toLowerCase(),
      authProviderId: auth.id,
      name: auth.raw?.user_metadata?.name || null,
    });
  }

  return user;
}

async function updateMe(userId, updates) {
  const setOps = {};

  if (updates.name !== undefined) setOps.name = updates.name;
  if (updates.avatar !== undefined) setOps.avatar = updates.avatar;
  if (updates.timezone !== undefined) setOps.timezone = updates.timezone;
  if (updates.onboarding_completed !== undefined) {
    setOps.onboarding_completed = updates.onboarding_completed;
  }

  if (updates.preferences) {
    if (updates.preferences.categories !== undefined) {
      setOps["preferences.categories"] = updates.preferences.categories;
    }
    if (updates.preferences.language !== undefined) {
      setOps["preferences.language"] = updates.preferences.language;
    }
    if (updates.preferences.theme !== undefined) {
      setOps["preferences.theme"] = updates.preferences.theme;
    }
    if (updates.preferences.notifications) {
      if (updates.preferences.notifications.morning !== undefined) {
        setOps["preferences.notifications.morning"] = updates.preferences.notifications.morning;
      }
      if (updates.preferences.notifications.evening !== undefined) {
        setOps["preferences.notifications.evening"] = updates.preferences.notifications.evening;
      }
      if (updates.preferences.notifications.practice369 !== undefined) {
        setOps["preferences.notifications.practice369"] = updates.preferences.notifications.practice369;
      }
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: setOps }, { new: true, runValidators: true });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  return user;
}

module.exports = {
  serializeUser,
  getOrCreateFromAuth,
  updateMe,
};
