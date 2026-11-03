function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

/**
 * Dev/test only — never honor mock flags in production.
 */
function shouldUseLocalAiFallback({ mockEnvKey, configured }) {
  if (isProductionEnv()) {
    return false;
  }
  return process.env[mockEnvKey] === "1" || !configured;
}

function createAiUnavailableError(message = "AI service is temporarily unavailable. Please try again later.") {
  const error = new Error(message);
  error.status = 503;
  error.code = "AI_UNAVAILABLE";
  return error;
}

function assertAiConfigured(configured) {
  if (!configured && isProductionEnv()) {
    throw createAiUnavailableError();
  }
}

module.exports = {
  isProductionEnv,
  shouldUseLocalAiFallback,
  createAiUnavailableError,
  assertAiConfigured,
};
