const { Schema, model } = require("mongoose");

const journalEntrySchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["gratitude", "free_write", "future_self"],
      default: "free_write",
    },
    mood: { type: Number, min: 1, max: 5 },
    image_path: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "journal_entries",
  }
);

journalEntrySchema.index({ user_id: 1, created_at: -1 });

module.exports = model("JournalEntry", journalEntrySchema);
