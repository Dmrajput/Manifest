const { Schema, model } = require("mongoose");

const visionItemSchema = new Schema(
  {
    image_path: { type: String, required: true },
    caption: { type: String },
    position: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const visionBoardSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    cover_image: { type: String },
    items: { type: [visionItemSchema], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "vision_boards",
  }
);

module.exports = model("VisionBoard", visionBoardSchema);
