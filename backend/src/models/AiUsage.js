const { Schema, model } = require("mongoose");

const aiUsageSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    feature: { type: String, required: true },
    tokens: { type: Number, default: 0, min: 0 },
    estimated_cost: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "ai_usage",
  }
);

aiUsageSchema.index({ user_id: 1, created_at: -1 });
aiUsageSchema.index({ user_id: 1, feature: 1, created_at: -1 });

module.exports = model("AiUsage", aiUsageSchema);
