const OpenAI = require("openai");
const { model } = require("../config/openai");

function buildFallbackAffirmations({ category, tone, count, goal }) {
  const focus = goal || category || "growth";
  const vibe = tone || "encouraging";
  const lines = [
    `I am ${vibe} and aligned with ${focus}.`,
    `I take grounded action toward ${focus} every day.`,
    `I trust my ability to grow through ${focus}.`,
    `I welcome progress in ${focus} with calm confidence.`,
    `I am worthy of success in ${focus}.`,
    `I choose thoughts that support ${focus}.`,
    `I move forward with clarity around ${focus}.`,
    `I celebrate small wins on my path to ${focus}.`,
    `I remain open to opportunities related to ${focus}.`,
    `I create a life that reflects ${focus} with integrity.`,
  ];
  return lines.slice(0, count).map((text) => ({ text, category: category || "confidence" }));
}

function getClient() {
  if (process.env.AI_AFFIRMATIONS_MOCK === "1") {
    return null;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

async function generateAffirmations({
  goal,
  category,
  language = "en",
  tone = "encouraging",
  count = 5,
} = {}) {
  const safeCount = Math.min(Math.max(Number(count) || 5, 3), 10);
  const client = getClient();

  if (!client) {
    return {
      affirmations: buildFallbackAffirmations({ category, tone, count: safeCount, goal }).map((item) => ({
        ...item,
        language,
      })),
      tokens: 0,
      estimatedCost: 0,
      provider: "fallback",
    };
  }

  const prompt = [
    `Generate ${safeCount} short positive affirmations.`,
    `Language: ${language}.`,
    `Tone: ${tone}.`,
    category ? `Category: ${category}.` : "",
    goal ? `Related goal: ${goal}.` : "",
    "Encourage realistic action and self-reflection. Do not promise guaranteed outcomes.",
    'Return JSON only: {"affirmations":[{"text":"...","category":"..."}]}',
  ]
    .filter(Boolean)
    .join(" ");

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || model || "gpt-4o-mini",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You write concise first-person affirmations for a manifestation app.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { affirmations: [] };
  }

  const affirmations = Array.isArray(parsed.affirmations)
    ? parsed.affirmations
        .filter((item) => item && typeof item.text === "string" && item.text.trim())
        .slice(0, safeCount)
        .map((item) => ({
          text: item.text.trim(),
          category: item.category || category || "confidence",
          language,
        }))
    : [];

  if (affirmations.length === 0) {
    return {
      affirmations: buildFallbackAffirmations({ category, tone, count: safeCount, goal }).map((item) => ({
        ...item,
        language,
      })),
      tokens: completion.usage?.total_tokens || 0,
      estimatedCost: 0,
      provider: "fallback",
    };
  }

  return {
    affirmations,
    tokens: completion.usage?.total_tokens || 0,
    estimatedCost: 0,
    provider: "openai",
  };
}

module.exports = {
  generateAffirmations,
  buildFallbackAffirmations,
};
