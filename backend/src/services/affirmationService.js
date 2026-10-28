const { Affirmation, UserAffirmation } = require("../models");

const DEFAULT_LIBRARY = [
  { text: "I am confident, capable, and worthy of success.", category: "confidence", language: "en" },
  { text: "I attract opportunities that support my growth.", category: "career", language: "en" },
  { text: "Money flows to me easily and frequently.", category: "money", language: "en" },
  { text: "I nurture relationships with kindness and honesty.", category: "relationships", language: "en" },
  { text: "I honor my body and mind with rest and care.", category: "wellness", language: "en" },
  { text: "Every day I become more aligned with my dream life.", category: "confidence", language: "en" },
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
  if (count > 0) return;
  await Affirmation.insertMany(
    DEFAULT_LIBRARY.map((item) => ({
      ...item,
      source: "library",
    }))
  );
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
  if (category) filter.category = category;
  if (language) filter.language = language;

  const docs = await Affirmation.find(filter).sort({ created_at: -1 }).limit(100);
  return docs.map((doc) => serializeAffirmation(doc, favoriteIds));
}

async function setFavorite(userId, affirmationId, isFavorite = true) {
  const affirmation = await Affirmation.findById(affirmationId);
  if (!affirmation) {
    const error = new Error("Affirmation not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const record = await UserAffirmation.findOneAndUpdate(
    { user_id: userId, affirmation_id: affirmationId },
    { $set: { is_favorite: Boolean(isFavorite) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    affirmation: serializeAffirmation(affirmation, isFavorite ? new Set([affirmationId.toString()]) : new Set()),
    is_favorite: record.is_favorite,
  };
}

async function pickAffirmationOfTheDay(userId, categories = []) {
  await ensureLibrarySeeded();
  const filter = { source: { $in: ["library", "ai"] } };
  if (categories.length > 0) {
    filter.category = { $in: categories };
  }

  const count = await Affirmation.countDocuments(filter);
  if (count === 0) {
    return null;
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
      category: item.category || null,
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
  setFavorite,
  pickAffirmationOfTheDay,
  saveGeneratedAffirmations,
  serializeAffirmation,
};
