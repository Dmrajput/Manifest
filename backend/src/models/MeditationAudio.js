const { Schema, model } = require("mongoose");

const meditationAudioSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    audio_path: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    category: { type: String, index: true },
    is_premium: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "meditation_audio",
  }
);

module.exports = model("MeditationAudio", meditationAudioSchema);
