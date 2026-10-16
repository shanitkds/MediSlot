const logger = require("../config/logger");
const { error } = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.message === "Origin not allowed by CORS") {
    return error(res, {
      status: 403,
      message: "Origin not allowed",
      code: "FORBIDDEN",
    });
  }

  if (err instanceof ApiError) {
    if (err.statusCode === 401) {
      try {
        const { clearCookieOptions, ACCESS_COOKIE_NAME } = require("../config/cookie");
        const env = require("../config/env");
        res.clearCookie(env.COOKIE_NAME, clearCookieOptions());
        res.clearCookie(ACCESS_COOKIE_NAME, clearCookieOptions());
      } catch {}
    }
    return error(res, {
      status: err.statusCode,
      message: err.message,
      code: err.code,
      fields: err.fields,
    });
  }

  if (err.name === "CastError") {
    return error(res, { status: 400, message: "Invalid identifier", code: "UNPROCESSABLE" });
  }

  if (err.code === 11000) {
    const key = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    const val = err.keyValue ? err.keyValue[key] : "";
    const msg =
      key === "email"
        ? (val ? `An account with email "${val}" already exists` : "An account with this email address already exists")
        : "Resource already exists";
    return error(res, {
      status: 409,
      message: msg,
      code: "CONFLICT",
      fields: { [key]: msg },
    });
  }

  logger.error({ err, requestId: req.requestId }, "Unhandled error");
  return error(res, {
    status: 500,
    message: "Internal server error",
    code: "INTERNAL",
  });
}

module.exports = errorHandler;
