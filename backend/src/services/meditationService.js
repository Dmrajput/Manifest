const { MeditationAudio } = require("../models");
const aiQuotaService = require("./aiQuotaService");

const SEED = [
  {
    title: "Abundance Meditation",
    audio_path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 372,
    category: "abundance",
    is_premium: false,
  },
  {
    title: "Self Love Meditation",
    audio_path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 420,
    category: "self_love",
    is_premium: false,
  },
  {
    title: "Morning Alignment",
    audio_path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 300,
    category: "morning",
    is_premium: false,
  },
  {
    title: "Deep Visualization (Premium)",
    audio_path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 540,
    category: "visualization",
    is_premium: true,
  },
];

function serialize(doc, { premium }) {
  const locked = doc.is_premium && !premium;
  return {
    id: doc._id.toString(),
    title: doc.title,
    duration: doc.duration,
    category: doc.category,
    is_premium: Boolean(doc.is_premium),
    locked,
    audio_path: locked ? null : doc.audio_path,
  };
}

async function ensureSeed() {
  const count = await MeditationAudio.countDocuments();
  if (count === 0) {
    await MeditationAudio.insertMany(SEED);
  }
}

async function listTracks(userId) {
  await ensureSeed();
  const premium = await aiQuotaService.isPremiumUser(userId);
  const docs = await MeditationAudio.find().sort({ is_premium: 1, title: 1 });
  return docs.map((doc) => serialize(doc, { premium }));
}

async function getTrack(userId, trackId) {
  await ensureSeed();
  const premium = await aiQuotaService.isPremiumUser(userId);
  const doc = await MeditationAudio.findById(trackId);
  if (!doc) {
    const error = new Error("Track not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  if (doc.is_premium && !premium) {
    const error = new Error("Premium subscription required for this track");
    error.status = 403;
    error.code = "PREMIUM_REQUIRED";
    throw error;
  }
  return serialize(doc, { premium });
}

module.exports = { listTracks, getTrack, ensureSeed, SEED };
