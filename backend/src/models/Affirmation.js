const { Schema, model } = require("mongoose");

const affirmationSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    category: { type: String, index: true },
    language: { type: String, default: "en", index: true },
    source: { type: String, default: "library" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "affirmations",
  }
);

affirmationSchema.index({ category: 1, language: 1 });

module.exports = model("Affirmation", affirmationSchema);
