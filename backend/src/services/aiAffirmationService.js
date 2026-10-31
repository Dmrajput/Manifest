const { generateText, isGeminiConfigured } = require("../config/gemini");
const { categoryLabel, normalizeCategory } = require("../constants/affirmationCategories");

const CATEGORY_PROMPTS = {
  body: "physical body, fitness, posture, energy, and self-image",
  personality: "character traits, confidence, kindness, discipline, and self-expression",
  career: "work, skills, leadership, opportunities, and professional growth",
  health: "physical and mental wellbeing, habits, rest, and recovery",
  love_life: "romance, partnership, dating, emotional intimacy, and healthy love",
  pet: "bond with a pet, care, play, and companionship",
  home: "living space, comfort, order, safety, and atmosphere at home",
  car: "vehicle ownership, safe driving, freedom to travel, and reliable transport",
  money: "abundance, smart earning, saving, and calm financial confidence",
  confidence: "self-belief, courage, and inner strength",
  relationships: "friendships, family, and interpersonal connection",
  wellness: "balance, calm, and holistic wellbeing",
};

function buildFallbackAffirmations({ category, tone, count, goal }) {
  const id = normalizeCategory(category) || "confidence";
  const focus = goal || categoryLabel(id);
  const topic = CATEGORY_PROMPTS[id] || focus;
  const vibe = tone || "encouraging";
  const lines = [
    `I am ${vibe} as I grow in ${focus}.`,
    `I take grounded action each day around ${topic}.`,
    `I trust myself to improve my ${focus} with patience.`,
    `I welcome progress in ${focus} with calm confidence.`,
    `I am worthy of success in ${focus}.`,
    `I choose thoughts that support my ${focus}.`,
    `I move forward with clarity about ${topic}.`,
    `I celebrate small wins related to ${focus}.`,
    `I remain open to opportunities that nurture my ${focus}.`,
    `I create a life that reflects healthy ${focus} with integrity.`,
  ];
  return lines.slice(0, count).map((text) => ({ text, category: id }));
}

function useMock() {
  return process.env.AI_AFFIRMATIONS_MOCK === "1" || !isGeminiConfigured();
}

async function generateAffirmations({
  goal,
  category,
  language = "en",
  tone = "encouraging",
  count = 5,
} = {}) {
  const safeCount = Math.min(Math.max(Number(count) || 5, 3), 10);
  const normalizedCategory = normalizeCategory(category) || "confidence";
  const label = categoryLabel(normalizedCategory);
  const topic = CATEGORY_PROMPTS[normalizedCategory] || label;

  if (useMock()) {
    return {
      affirmations: buildFallbackAffirmations({
        category: normalizedCategory,
        tone,
        count: safeCount,
        goal,
      }).map((item) => ({
        ...item,
        language,
      })),
      tokens: 0,
      estimatedCost: 0,
      provider: "fallback",
    };
  }

  const prompt = [
    `Generate ${safeCount} short positive first-person affirmations.`,
    `Language: ${language}.`,
    `Tone: ${tone}.`,
    `Primary focus category id: ${normalizedCategory} (${label}).`,
    `Write specifically about: ${topic}.`,
    goal ? `Related goal: ${goal}.` : "",
    "Encourage realistic action and self-reflection. Do not promise guaranteed outcomes.",
    `Every affirmation object must use category "${normalizedCategory}".`,
    'Return JSON only: {"affirmations":[{"text":"...","category":"..."}]}',
  ]
    .filter(Boolean)
    .join(" ");

  let result;
  try {
    result = await generateText({
      prompt,
      system:
        "You write concise first-person affirmations for a manifestation app. Stay tightly focused on the requested category. Return valid JSON only.",
      temperature: 0.8,
      maxOutputTokens: 700,
      json: true,
    });
  } catch (error) {
    return {
      affirmations: buildFallbackAffirmations({
        category: normalizedCategory,
        tone,
        count: safeCount,
        goal,
      }).map((item) => ({
        ...item,
        language,
      })),
      tokens: 0,
      estimatedCost: 0,
      provider: "fallback",
      warning: error.message,
    };
  }

  const parsed = result.json || {};
  const affirmations = Array.isArray(parsed.affirmations)
    ? parsed.affirmations
        .filter((item) => item && typeof item.text === "string" && item.text.trim())
        .slice(0, safeCount)
        .map((item) => ({
          text: item.text.trim(),
          category: normalizeCategory(item.category) || normalizedCategory,
          language,
        }))
    : [];

  if (affirmations.length === 0) {
    return {
      affirmations: buildFallbackAffirmations({
        category: normalizedCategory,
        tone,
        count: safeCount,
        goal,
      }).map((item) => ({
        ...item,
        language,
      })),
      tokens: result.tokens || 0,
      estimatedCost: 0,
      provider: "fallback",
    };
  }

  return {
    affirmations,
    tokens: result.tokens || 0,
    estimatedCost: 0,
    provider: "google",
  };
}

module.exports = {
  generateAffirmations,
  buildFallbackAffirmations,
};
