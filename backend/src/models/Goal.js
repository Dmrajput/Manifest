const { Schema, model } = require("mongoose");

const goalTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    due_date: { type: Date },
    completed_at: { type: Date },
    weight: { type: Number, default: 1, min: 1 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const goalSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    target_date: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      index: true,
    },
    cover_image: { type: String },
    tasks: { type: [goalTaskSchema], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "goals",
  }
);

goalSchema.index({ user_id: 1, status: 1 });

module.exports = model("Goal", goalSchema);
