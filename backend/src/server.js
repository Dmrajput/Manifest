require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/database");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await connectDatabase();
      console.log("Connected to MongoDB");
    } else {
      console.warn("MONGODB_URI not set — starting API without database connection");
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
