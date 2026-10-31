const { Schema, model } = require("mongoose");

const reminderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["morning", "evening", "practice_369"],
      required: true,
    },
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59, default: 0 },
    timezone: { type: String, default: "UTC" },
    enabled: { type: Boolean, default: true },
    label: { type: String },
    /** @deprecated keep for older docs */
    time: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "reminders",
  }
);

reminderSchema.index({ user_id: 1, type: 1 }, { unique: true });

module.exports = model("Reminder", reminderSchema);
