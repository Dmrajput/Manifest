const { Affirmation, UserAffirmation } = require("../models");
const {
  AFFIRMATION_CATEGORIES,
  normalizeCategory,
} = require("../constants/affirmationCategories");

const DEFAULT_LIBRARY = [
  { text: "I treat my body with respect, strength, and gratitude every day.", category: "body", language: "en" },
  { text: "I am becoming the confident, kind person I choose to be.", category: "personality", language: "en" },
  { text: "I attract opportunities that support my career growth.", category: "career", language: "en" },
  { text: "I honor my health with steady, caring daily choices.", category: "health", language: "en" },
  { text: "I give and receive love with honesty, warmth, and trust.", category: "love_life", language: "en" },
  { text: "I care for my pet with patience, joy, and responsibility.", category: "pet", language: "en" },
  { text: "My home is a peaceful space that supports my best life.", category: "home", language: "en" },
  { text: "I drive with calm focus and appreciate safe, reliable travel.", category: "car", language: "en" },
  { text: "Money flows to me easily through aligned, useful action.", category: "money", language: "en" },
  { text: "I am confident, capable, and worthy of success.", category: "confidence", language: "en" },
  // Legacy aliases kept for older user preferences / filters
  { text: "I nurture relationships with kindness and honesty.", category: "relationships", language: "en" },
  { text: "I honor my body and mind with rest and care.", category: "wellness", language: "en" },
];

function serializeAffirmation(doc, favoriteIds = new Set()) {
  const id = doc._id.toString();
  return {
    id,
    text: doc.text,
    category: doc.category || null,
    language: doc.language || "en",
    source: doc.source || "library",
    is_favorite: favoriteIds.has(id),
    created_at: doc.created_at,
  };
}

async function ensureLibrarySeeded() {
  const count = await Affirmation.countDocuments({ source: "library" });
  if (count === 0) {
    await Affirmation.insertMany(
      DEFAULT_LIBRARY.map((item) => ({
        ...item,
        source: "library",
      }))
    );
    return;
  }

  // Backfill missing preset categories for existing installs
  for (const item of DEFAULT_LIBRARY) {
    const exists = await Affirmation.exists({
      source: "library",
      category: item.category,
      text: item.text,
    });
    if (!exists) {
      const categoryExists = await Affirmation.exists({
        source: "library",
        category: item.category,
      });
      if (!categoryExists) {
        await Affirmation.create({ ...item, source: "library" });
      }
    }
  }
}

async function listAffirmations(userId, { category, language, favoritesOnly = false } = {}) {
  await ensureLibrarySeeded();

  const favorites = await UserAffirmation.find({ user_id: userId, is_favorite: true }).lean();
  const favoriteIds = new Set(favorites.map((item) => item.affirmation_id.toString()));

  if (favoritesOnly) {
    const ids = favorites.map((item) => item.affirmation_id);
    const docs = await Affirmation.find({ _id: { $in: ids } }).sort({ created_at: -1 });
    return docs.map((doc) => serializeAffirmation(doc, favoriteIds));
  }

  const filter = {};
  const normalized = normalizeCategory(category);
  if (normalized) filter.category = normalized;
  if (language) filter.language = language;

  const docs = await Affirmation.find(filter).sort({ created_at: -1 }).limit(100);
  return docs.map((doc) => serializeAffirmation(doc, favoriteIds));
}

async function listCategories() {
  await ensureLibrarySeeded();
  const used = await Affirmation.distinct("category", { category: { $ne: null } });
  const presetIds = new Set(AFFIRMATION_CATEGORIES.map((item) => item.id));
  const extras = used
    .map((value) => normalizeCategory(value))
    .filter((id) => id && !presetIds.has(id))
    .sort()
    .map((id) => ({ id, label: id.replace(/_/g, " ") }));

  return [...AFFIRMATION_CATEGORIES, ...extras];
}

async function setFavorite(userId, affirmationId, isFavorite = true) {
  const affirmation = await Affirmation.findById(affirmationId);
  if (!affirmation) {
    const error = new Error("Affirmation not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const shouldFavorite = Boolean(isFavorite);
  const record = await UserAffirmation.findOneAndUpdate(
    { user_id: userId, affirmation_id: affirmation._id },
    { $set: { is_favorite: shouldFavorite }, $setOnInsert: { user_id: userId, affirmation_id: affirmation._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (shouldFavorite) {
    const { UserActivity } = require("../models");
    await UserActivity.create({
      user_id: userId,
      activity_type: "affirmation_favorite",
      metadata: { affirmation_id: affirmation._id.toString() },
    });
  }

  return {
    affirmation: serializeAffirmation(
      affirmation,
      shouldFavorite ? new Set([affirmation._id.toString()]) : new Set()
    ),
    is_favorite: Boolean(record?.is_favorite),
  };
}

async function pickAffirmationOfTheDay(userId, categories = []) {
  await ensureLibrarySeeded();
  const filter = { source: { $in: ["library", "ai"] } };
  const normalized = (categories || []).map(normalizeCategory).filter(Boolean);
  if (normalized.length > 0) {
    filter.category = { $in: normalized };
  }

  const count = await Affirmation.countDocuments(filter);
  if (count === 0) {
    // Fall back to full library if preferred categories are empty
    delete filter.category;
    const fallbackCount = await Affirmation.countDocuments(filter);
    if (fallbackCount === 0) return null;
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const doc = await Affirmation.findOne(filter).skip(dayIndex % fallbackCount);
    if (!doc) return null;
    const favorite = await UserAffirmation.findOne({
      user_id: userId,
      affirmation_id: doc._id,
      is_favorite: true,
    });
    return serializeAffirmation(doc, favorite ? new Set([doc._id.toString()]) : new Set());
  }

  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const skip = dayIndex % count;
  const doc = await Affirmation.findOne(filter).skip(skip);
  if (!doc) return null;

  const favorite = await UserAffirmation.findOne({
    user_id: userId,
    affirmation_id: doc._id,
    is_favorite: true,
  });

  return serializeAffirmation(doc, favorite ? new Set([doc._id.toString()]) : new Set());
}

async function saveGeneratedAffirmations(items) {
  const docs = await Affirmation.insertMany(
    items.map((item) => ({
      text: item.text,
      category: normalizeCategory(item.category) || item.category || null,
      language: item.language || "en",
      source: "ai",
    }))
  );
  return docs.map((doc) => serializeAffirmation(doc));
}

module.exports = {
  DEFAULT_LIBRARY,
  ensureLibrarySeeded,
  listAffirmations,
  listCategories,
  setFavorite,
  pickAffirmationOfTheDay,
  saveGeneratedAffirmations,
  serializeAffirmation,
};
