const OpenAI = require("openai");

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

module.exports = {
  openai: createOpenAIClient(),
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
};
