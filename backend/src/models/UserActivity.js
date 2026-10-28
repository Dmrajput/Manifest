const { Schema, model } = require("mongoose");

const userActivitySchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    activity_type: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "user_activity",
  }
);

userActivitySchema.index({ user_id: 1, created_at: -1 });
userActivitySchema.index({ user_id: 1, activity_type: 1, created_at: -1 });

module.exports = model("UserActivity", userActivitySchema);
