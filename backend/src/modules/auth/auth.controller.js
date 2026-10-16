const env = require("../../config/env");
const { success } = require("../../utils/ApiResponse");
const {
  ACCESS_COOKIE_NAME,
  sessionCookieOptions,
  accessCookieOptions,
  clearCookieOptions,
} = require("../../config/cookie");
const authService = require("./auth.service");

function setSession(res, rawToken, accessToken) {
  res.cookie(env.COOKIE_NAME, rawToken, sessionCookieOptions());
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions());
}

function clearSession(res) {
  res.clearCookie(env.COOKIE_NAME, clearCookieOptions());
  res.clearCookie(ACCESS_COOKIE_NAME, clearCookieOptions());
}

async function login(req, res) {
  const { user, rawToken, accessToken } = await authService.login(req.body, req);
  setSession(res, rawToken, accessToken);
  return success(res, {
    message: "Logged in",
    data: { user, accessToken, refreshToken: rawToken },
  });
}

async function refresh(req, res) {
  const rawToken = req.cookies?.[env.COOKIE_NAME] || req.body?.refreshToken;
  const { user, accessToken } = await authService.refresh(rawToken);
  setSession(res, rawToken, accessToken);
  return success(res, {
    message: "Token refreshed",
    data: { user, accessToken, refreshToken: rawToken },
  });
}

async function logout(req, res) {
  await authService.logout(req.sessionDoc?._id, req.user, req);
  clearSession(res);
  return success(res, { message: "Logged out", data: null });
}

async function me(req, res) {
  const user = await authService.me(req.user);
  return success(res, { message: "OK", data: { user } });
}

async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email, req);
  return success(res, { message: "If an account exists, a reset email was sent", data: null });
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body, req);
  clearSession(res);
  return success(res, { message: "Password reset. You can log in now.", data: null });
}

async function changePassword(req, res) {
  const { rawToken, accessToken } = await authService.changePassword(req.user, req.body, req);
  setSession(res, rawToken, accessToken);
  return success(res, { message: "Password changed", data: null });
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};
