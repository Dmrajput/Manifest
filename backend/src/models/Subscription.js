const { Schema, model } = require("mongoose");

const subscriptionSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "canceled", "expired", "grace_period", "trial"],
      default: "trial",
      index: true,
    },
    expires_at: { type: Date },
    provider: { type: String, default: "revenuecat" },
    external_id: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "subscriptions",
  }
);

subscriptionSchema.index({ user_id: 1, status: 1 });

module.exports = model("Subscription", subscriptionSchema);
