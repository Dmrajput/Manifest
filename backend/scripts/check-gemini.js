require("dotenv").config();
const { generateText, isGeminiConfigured, getModelName, getApiKey } = require("../src/config/gemini");

async function main() {
  console.log(
    JSON.stringify(
      {
        configured: isGeminiConfigured(),
        keyPrefix: getApiKey() ? `${getApiKey().slice(0, 6)}...` : null,
        model: getModelName(),
        mocks: {
          affirmations: process.env.AI_AFFIRMATIONS_MOCK,
          coach: process.env.AI_COACH_MOCK,
        },
      },
      null,
      2
    )
  );

  try {
    const result = await generateText({
      prompt: "Reply with exactly: Google AI integration OK",
      system: "Reply briefly with no extra commentary.",
      temperature: 0.1,
      maxOutputTokens: 30,
    });
    console.log(
      JSON.stringify(
        {
          directGemini: "PASS",
          provider: result.provider,
          model: result.model,
          replyPreview: (result.text || "").slice(0, 120),
          tokens: result.tokens,
        },
        null,
        2
      )
    );

    const jsonResult = await generateText({
      prompt:
        'Return JSON only with shape {"affirmations":[{"text":"I am growing every day.","category":"confidence"}]}',
      system: "Return valid JSON only.",
      temperature: 0.2,
      maxOutputTokens: 120,
      json: true,
    });
    console.log(
      JSON.stringify(
        {
          jsonMode: Array.isArray(jsonResult.json?.affirmations) ? "PASS" : "FAIL",
          sample: jsonResult.json?.affirmations?.[0]?.text || null,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.log(
      JSON.stringify(
        {
          directGemini: "FAIL",
          message: err.message,
          status: err.status || null,
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}

main();
