const { GoogleGenerativeAI } = require("@google/generative-ai");

function getApiKey() {
  return (
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  ).trim();
}

const DEFAULT_MODEL = "gemini-3.5-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
];

function getModelName() {
  return (process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
}

function modelCandidates(preferred) {
  const primary = preferred || getModelName();
  return [...new Set([primary, ...FALLBACK_MODELS])];
}

function createGeminiClient() {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function extractText(result) {
  try {
    return result?.response?.text?.() || "";
  } catch {
    return "";
  }
}

function extractJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * One-shot text generation.
 */
async function generateText({
  prompt,
  system,
  temperature = 0.7,
  maxOutputTokens = 800,
  json = false,
} = {}) {
  const client = createGeminiClient();
  if (!client) {
    const error = new Error("Google AI API key not configured");
    error.status = 503;
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  let lastError;
  for (const modelName of modelCandidates()) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: system || undefined,
        generationConfig: {
          temperature,
          maxOutputTokens,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      });

      const result = await model.generateContent(prompt);
      const text = extractText(result);
      const usage = result?.response?.usageMetadata || {};
      const tokens =
        Number(usage.totalTokenCount) ||
        Number(usage.promptTokenCount || 0) + Number(usage.candidatesTokenCount || 0) ||
        0;

      return {
        text,
        json: json ? extractJson(text) : null,
        tokens,
        model: modelName,
        provider: "google",
      };
    } catch (error) {
      lastError = error;
      const msg = String(error.message || "");
      const retryable = msg.includes("[404") || msg.includes("[503") || msg.includes("[429");
      if (!retryable) throw error;
    }
  }

  throw lastError || new Error("Google AI request failed");
}

/**
 * Chat-style generation with prior turns.
 * history: [{ role: "user"|"assistant", content: string }]
 */
async function generateChat({
  system,
  history = [],
  message,
  temperature = 0.7,
  maxOutputTokens = 500,
} = {}) {
  const client = createGeminiClient();
  if (!client) {
    const error = new Error("Google AI API key not configured");
    error.status = 503;
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  const geminiHistory = history
    .filter((item) => item?.content && (item.role === "user" || item.role === "assistant"))
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.content) }],
    }));

  // Gemini requires history to start with a user turn when present.
  while (geminiHistory.length && geminiHistory[0].role !== "user") {
    geminiHistory.shift();
  }

  let lastError;
  for (const modelName of modelCandidates()) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: system || undefined,
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      });

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(message);
      const text = extractText(result);
      const usage = result?.response?.usageMetadata || {};
      const tokens =
        Number(usage.totalTokenCount) ||
        Number(usage.promptTokenCount || 0) + Number(usage.candidatesTokenCount || 0) ||
        0;

      return {
        text,
        tokens,
        model: modelName,
        provider: "google",
      };
    } catch (error) {
      lastError = error;
      const msg = String(error.message || "");
      const retryable = msg.includes("[404") || msg.includes("[503") || msg.includes("[429");
      if (!retryable) throw error;
    }
  }

  throw lastError || new Error("Google AI chat request failed");
}

function isGeminiConfigured() {
  return Boolean(getApiKey());
}

module.exports = {
  createGeminiClient,
  generateText,
  generateChat,
  isGeminiConfigured,
  getModelName,
  getApiKey,
  extractJson,
};
