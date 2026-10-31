/**
 * Preset affirmation focus areas used by library seed, AI generate, and daily pick.
 * Custom free-text categories are also allowed (max length enforced by validators).
 */
const AFFIRMATION_CATEGORIES = [
  { id: "body", label: "Body" },
  { id: "personality", label: "Personality" },
  { id: "career", label: "Career" },
  { id: "health", label: "Health" },
  { id: "love_life", label: "Love life" },
  { id: "pet", label: "Pet" },
  { id: "home", label: "Home" },
  { id: "car", label: "Car" },
  { id: "money", label: "Money" },
  { id: "confidence", label: "Confidence" },
];

const AFFIRMATION_CATEGORY_IDS = AFFIRMATION_CATEGORIES.map((item) => item.id);

const CATEGORY_LABELS = Object.fromEntries(
  AFFIRMATION_CATEGORIES.map((item) => [item.id, item.label])
);

function normalizeCategory(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!trimmed) return null;
  return trimmed.slice(0, 40);
}

function categoryLabel(value) {
  const id = normalizeCategory(value);
  if (!id) return "personal growth";
  return CATEGORY_LABELS[id] || id.replace(/_/g, " ");
}

module.exports = {
  AFFIRMATION_CATEGORIES,
  AFFIRMATION_CATEGORY_IDS,
  CATEGORY_LABELS,
  normalizeCategory,
  categoryLabel,
};
