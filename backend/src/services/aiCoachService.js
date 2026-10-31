const { AiConversation } = require("../models");
const { generateChat, generateText, isGeminiConfigured } = require("../config/gemini");
const aiQuotaService = require("./aiQuotaService");

const SYSTEM_PROMPT =
  "You are Manifestly AI Coach, a supportive manifestation and mindset coach. Keep advice practical, kind, and concise. Refuse harmful, illegal, or self-harm instructions. Do not claim supernatural guarantees.";

function serializeConversation(doc, { includeMessages = true } = {}) {
  return {
    id: doc._id.toString(),
    title: doc.title || "Coach chat",
    message_count: (doc.messages || []).length,
    messages: includeMessages
      ? (doc.messages || []).map((m) => ({
          id: m._id?.toString?.() || undefined,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        }))
      : undefined,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

async function listConversations(userId) {
  const docs = await AiConversation.find({ user_id: userId }).sort({ updated_at: -1 }).limit(50);
  return docs.map((doc) => serializeConversation(doc, { includeMessages: false }));
}

async function getConversation(userId, conversationId) {
  const doc = await AiConversation.findOne({ _id: conversationId, user_id: userId });
  if (!doc) {
    const error = new Error("Conversation not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return serializeConversation(doc);
}

async function deleteConversation(userId, conversationId) {
  const result = await AiConversation.findOneAndDelete({ _id: conversationId, user_id: userId });
  if (!result) {
    const error = new Error("Conversation not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return { id: conversationId, deleted: true };
}

function mockCoachReply(userMessage) {
  return `I hear you: "${userMessage.slice(0, 120)}". Let's turn that into one clear action today — write a short affirmation, journal one gratitude, and take a 5-minute visualization. You've got this.`;
}

function looksUnsafe(text) {
  const lowered = text.toLowerCase();
  const banned = ["how to make a bomb", "kill myself", "suicide method"];
  return banned.some((phrase) => lowered.includes(phrase));
}

function useMock() {
  return process.env.AI_COACH_MOCK === "1" || !isGeminiConfigured();
}

async function sendMessage(userId, { conversationId, message }) {
  if (!message?.trim()) {
    const error = new Error("Message is required");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  if (looksUnsafe(message)) {
    const error = new Error("Message blocked by safety filter");
    error.status = 400;
    error.code = "CONTENT_BLOCKED";
    throw error;
  }

  await aiQuotaService.assertWithinQuota(userId, "coach");

  let conversation;
  if (conversationId) {
    conversation = await AiConversation.findOne({ _id: conversationId, user_id: userId });
    if (!conversation) {
      const error = new Error("Conversation not found");
      error.status = 404;
      error.code = "NOT_FOUND";
      throw error;
    }
  } else {
    conversation = await AiConversation.create({
      user_id: userId,
      title: message.trim().slice(0, 60),
      messages: [],
    });
  }

  conversation.messages.push({ role: "user", content: message.trim() });

  let assistantText;
  let tokens = 0;

  if (useMock()) {
    assistantText = mockCoachReply(message.trim());
  } else {
    try {
      const history = conversation.messages
        .slice(0, -1)
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      const result = await generateChat({
        system: SYSTEM_PROMPT,
        history,
        message: message.trim(),
        temperature: 0.7,
        maxOutputTokens: 500,
      });
      assistantText = result.text?.trim() || mockCoachReply(message.trim());
      tokens = result.tokens || 0;
    } catch {
      assistantText = mockCoachReply(message.trim());
    }
  }

  conversation.messages.push({ role: "assistant", content: assistantText });
  await conversation.save();
  await aiQuotaService.recordUsage(userId, { feature: "coach", tokens });

  return {
    conversation: serializeConversation(conversation),
    reply: assistantText,
    quota: await aiQuotaService.getQuota(userId, "coach"),
  };
}

async function generateGoalPlan(userId, { goalTitle, description, weeks = 4 }) {
  await aiQuotaService.assertWithinQuota(userId, "goal_plan");

  const safeWeeks = Math.min(Math.max(Number(weeks) || 4, 1), 8);
  let tasks = [];
  let tokens = 0;

  if (useMock()) {
    tasks = Array.from({ length: safeWeeks }).flatMap((_, week) => [
      { title: `Week ${week + 1}: Research step for ${goalTitle}`, weight: 1 },
      { title: `Week ${week + 1}: Daily practice related to ${goalTitle}`, weight: 1 },
    ]);
  } else {
    try {
      const result = await generateText({
        system:
          'Return ONLY valid JSON: {"tasks":[{"title":"...","weight":1}]}. Create realistic daily/weekly action tasks. No markdown.',
        prompt: `Goal: ${goalTitle}\nDescription: ${description || "n/a"}\nWeeks: ${safeWeeks}`,
        temperature: 0.5,
        maxOutputTokens: 800,
        json: true,
      });
      tokens = result.tokens || 0;
      tasks = Array.isArray(result.json?.tasks) ? result.json.tasks : [];
      if (tasks.length === 0) {
        tasks = [{ title: `Define first milestone for ${goalTitle}`, weight: 1 }];
      }
    } catch {
      tasks = [{ title: `Define first milestone for ${goalTitle}`, weight: 1 }];
    }
  }

  await aiQuotaService.recordUsage(userId, { feature: "goal_plan", tokens });

  return {
    goal_title: goalTitle,
    weeks: safeWeeks,
    tasks: tasks.slice(0, 24).map((task) => ({
      title: String(task.title || "Action").slice(0, 200),
      weight: Number(task.weight) > 0 ? Number(task.weight) : 1,
    })),
    quota: await aiQuotaService.getQuota(userId, "goal_plan"),
  };
}

module.exports = {
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  generateGoalPlan,
  serializeConversation,
};
