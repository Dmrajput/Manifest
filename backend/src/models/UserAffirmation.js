const { Schema, model } = require("mongoose");

const userAffirmationSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    affirmation_id: { type: Schema.Types.ObjectId, ref: "Affirmation", required: true },
    is_favorite: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "user_affirmations",
  }
);

userAffirmationSchema.index({ user_id: 1, affirmation_id: 1 }, { unique: true });

module.exports = model("UserAffirmation", userAffirmationSchema);
