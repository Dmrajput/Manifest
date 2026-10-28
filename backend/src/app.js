const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { success } = require("./utils/response");
const { requestId } = require("./middleware/requestId");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const usersRouter = require("./routes/users");
const dashboardRouter = require("./routes/dashboard");
const affirmationsRouter = require("./routes/affirmations");
const aiRouter = require("./routes/ai");
const journalRouter = require("./routes/journal");
const practiceRouter = require("./routes/practice");
const progressRouter = require("./routes/progress");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN?.split(",") || true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(requestId);

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const max = Number(process.env.RATE_LIMIT_MAX) || 100;

app.use(
  "/api/v1",
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/v1/health", (req, res) => {
  success(res, {
    data: {
      service: "manifestly-api",
      status: "ok",
      requestId: req.requestId,
    },
    message: "Manifestly API is running",
  });
});

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/affirmations", affirmationsRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/journal", journalRouter);
app.use("/api/v1/practice", practiceRouter);
app.use("/api/v1/progress", progressRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
