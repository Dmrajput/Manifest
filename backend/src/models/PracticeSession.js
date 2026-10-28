const { Schema, model } = require("mongoose");

const practiceSessionSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    period: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      required: true,
    },
    count: { type: Number, default: 0, min: 0 },
    content: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "practice_sessions",
  }
);

practiceSessionSchema.index({ user_id: 1, date: 1, period: 1 }, { unique: true });
practiceSessionSchema.index({ user_id: 1, date: 1 });

module.exports = model("PracticeSession", practiceSessionSchema);
