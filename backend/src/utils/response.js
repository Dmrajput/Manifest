function success(res, { data = {}, message = "Request completed successfully", status = 200 } = {}) {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
}

function fail(res, { code = "INTERNAL_ERROR", message = "Something went wrong", status = 500, details } = {}) {
  const error = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return res.status(status).json({
    success: false,
    error,
  });
}

module.exports = { success, fail };
