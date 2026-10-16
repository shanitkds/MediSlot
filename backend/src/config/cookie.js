const env = require("./env");

const ACCESS_COOKIE_NAME = "access_token";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
    maxAge: env.JWT_ACCESS_TTL_MINUTES * 60 * 1000,
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
  };
}

module.exports = { ACCESS_COOKIE_NAME, sessionCookieOptions, accessCookieOptions, clearCookieOptions };
