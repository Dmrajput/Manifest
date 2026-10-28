const { fail } = require("../utils/response");

function notFound(req, res) {
  return fail(res, {
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
    status: 404,
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR");
  const message = status >= 500 ? "Internal server error" : err.message || "Request failed";

  if (status >= 500) {
    console.error(`[${req.requestId || "no-id"}]`, err);
  }

  return fail(res, { code, message, status });
}

module.exports = { notFound, errorHandler };
