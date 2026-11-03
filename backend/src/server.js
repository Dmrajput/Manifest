require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/database");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (process.env.NODE_ENV === "production") {
      const missing = ["MONGODB_URI", "SUPABASE_URL"].filter((key) => !process.env[key]?.trim());
      if (missing.length) {
        console.error(`Missing required production env: ${missing.join(", ")}`);
        process.exit(1);
      }
      if (process.env.AI_COACH_MOCK === "1" || process.env.AI_AFFIRMATIONS_MOCK === "1") {
        console.error("AI mock flags must not be enabled in production");
        process.exit(1);
      }
    }

    if (process.env.MONGODB_URI) {
      await connectDatabase();
      console.log("Connected to MongoDB");
    } else {
      console.warn("MONGODB_URI not set — starting API without database connection");
    }

    const razorpayService = require("./services/razorpayService");
    if (razorpayService.isConfigured()) {
      const mode = (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_live_") ? "live" : "test";
      console.log(`Razorpay payments enabled (${mode} mode)`);
    } else {
      console.warn("Razorpay keys missing — premium checkout disabled");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Manifestly API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
