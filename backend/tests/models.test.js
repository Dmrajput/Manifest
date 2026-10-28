const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const models = require("../src/models");

describe("mongoose models", () => {
  it("exports all MVP collections", () => {
    const expected = [
      "User",
      "Affirmation",
      "UserAffirmation",
      "Goal",
      "JournalEntry",
      "VisionBoard",
      "PracticeSession",
      "AiConversation",
      "MeditationAudio",
      "Reminder",
      "Subscription",
      "AiUsage",
      "UserActivity",
    ];

    for (const name of expected) {
      assert.ok(models[name], `missing model ${name}`);
      assert.equal(typeof models[name].modelName, "string");
    }
  });

  it("User requires email", () => {
    const user = new models.User({});
    const error = user.validateSync();
    assert.ok(error);
    assert.ok(error.errors.email);
  });

  it("Goal embeds tasks and defaults status to active", () => {
    const goal = new models.Goal({
      user_id: "507f1f77bcf86cd799439011",
      title: "Financial Freedom",
      tasks: [{ title: "Open savings account" }],
    });
    const error = goal.validateSync();
    assert.equal(error, undefined);
    assert.equal(goal.status, "active");
    assert.equal(goal.tasks.length, 1);
    assert.equal(goal.tasks[0].weight, 1);
  });

  it("PracticeSession only allows morning/afternoon/evening", () => {
    const session = new models.PracticeSession({
      user_id: "507f1f77bcf86cd799439011",
      date: new Date("2026-10-28"),
      period: "midnight",
      count: 1,
    });
    const error = session.validateSync();
    assert.ok(error);
    assert.ok(error.errors.period);
  });

  it("369 targets are represented by morning 3 / afternoon 6 / evening 9 periods", () => {
    const periods = ["morning", "afternoon", "evening"];
    for (const period of periods) {
      const session = new models.PracticeSession({
        user_id: "507f1f77bcf86cd799439011",
        date: new Date("2026-10-28"),
        period,
        count: 0,
      });
      assert.equal(session.validateSync(), undefined);
    }
  });
});
