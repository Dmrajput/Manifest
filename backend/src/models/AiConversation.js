const { Schema, model } = require("mongoose");

const aiMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const aiConversationSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String },
    messages: { type: [aiMessageSchema], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "ai_conversations",
  }
);

aiConversationSchema.index({ user_id: 1, created_at: -1 });

module.exports = model("AiConversation", aiConversationSchema);
