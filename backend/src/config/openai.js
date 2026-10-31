/**
 * Legacy OpenAI config kept for compatibility.
 * Manifestly AI now uses Google AI Studio (Gemini) via ./gemini.js
 */
const { isGeminiConfigured, getModelName } = require("./gemini");

module.exports = {
  openai: null,
  model: getModelName(),
  isConfigured: isGeminiConfigured,
};
