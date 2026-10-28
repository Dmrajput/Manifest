const { Schema, model } = require("mongoose");

const reminderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    time: { type: String, required: true },
    timezone: { type: String, default: "UTC" },
    enabled: { type: Boolean, default: true },
    label: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "reminders",
  }
);

module.exports = model("Reminder", reminderSchema);
