const { Schema, model } = require("mongoose");

const userPreferenceSchema = new Schema(
  {
    categories: { type: [String], default: [] },
    language: { type: String, default: "en" },
    theme: { type: String, default: "system" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    avatar: { type: String },
    timezone: { type: String, default: "UTC" },
    authProviderId: { type: String, index: true },
    onboarding_completed: { type: Boolean, default: false },
    preferences: { type: userPreferenceSchema, default: () => ({}) },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "users",
  }
);

module.exports = model("User", userSchema);
