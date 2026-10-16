const env = require("../../config/env");
const User = require("../../models/User");
const Session = require("../../models/Session");
const Role = require("../../models/Role");
const Settings = require("../../models/Settings");
const PasswordResetToken = require("../../models/PasswordResetToken");
const ApiError = require("../../utils/ApiError");
const { hashPassword, verifyPassword, hashToken } = require("../../utils/hash");
const { createOpaqueToken, createAccessToken, addHours, addMinutes } = require("../../utils/tokens");
const { sendPasswordResetEmail } = require("../../utils/mailer");
const { resolveAccess } = require("./auth.access");
const auditService = require("../audit/audit.service");

function clientMeta(req) {
  return {
    ip: req?.ip || "",
    userAgent: req?.get?.("user-agent") || "",
  };
}

async function getSettings() {
  return Settings.findOneAndUpdate(
    { key: "app" },
    { $setOnInsert: { key: "app" } },
    { upsert: true, new: true }
  );
}

async function createSession(user, req) {
  const token = createOpaqueToken();
  const session = await Session.create({
    userId: user._id,
    tokenHash: token.hash,
    userAgent: clientMeta(req).userAgent,
    ip: clientMeta(req).ip,
    expiresAt: addHours(new Date(), (env.JWT_REFRESH_TTL_DAYS || 7) * 24),
    lastSeenAt: new Date(),
  });
  const accessToken = createAccessToken(user);
  return { session, rawToken: token.raw, accessToken };
}

async function buildCurrentUser(user) {
  const populated = await User.findById(user._id).populate("roleIds");
  const access = await resolveAccess(populated);
  const data = populated.toJSON();
  data.roles = access.roles;
  data.permissions = access.permissions;
  return data;
}



async function login({ email, password }, req) {
  const user = await User.findOne({ email: email.toLowerCase(), isArchive: false }).select("+passwordHash");
  if (!user) {
    await auditService.log({ action: "login_failed", module: "auth", entity: "User", email, req });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await auditService.log({
      actor: user,
      action: "login_failed",
      module: "auth",
      entity: "User",
      entityId: user._id,
      req,
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.status === "disabled") throw ApiError.forbidden("Account is disabled");

  const { session, rawToken, accessToken } = await createSession(user, req);
  await auditService.log({
    actor: user,
    action: "login",
    module: "auth",
    entity: "Session",
    entityId: session._id,
    req,
  });

  return { user: await buildCurrentUser(user), rawToken, accessToken };
}

async function logout(sessionId, actor, req) {
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  } else {
    const rawToken = req?.cookies?.[env.COOKIE_NAME] || req?.body?.refreshToken;
    if (rawToken) {
      await Session.deleteOne({ tokenHash: hashToken(rawToken) });
    }
  }

  if (actor || sessionId) {
    await auditService.log({
      actor,
      action: "logout",
      module: "auth",
      entity: "Session",
      entityId: sessionId || null,
      req,
    });
  }
}

async function me(user) {
  return buildCurrentUser(user);
}



async function forgotPassword(email, req) {
  const user = await User.findOne({ email: email.toLowerCase(), isArchive: false });
  if (user) {
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
    const token = createOpaqueToken();
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: token.hash,
      expiresAt: addMinutes(new Date(), env.PASSWORD_RESET_TTL_MINUTES),
    });
    await sendPasswordResetEmail({ to: user.email, name: user.name, token: token.raw });
    await auditService.log({
      actor: user,
      action: "forgot_password",
      module: "auth",
      entity: "User",
      entityId: user._id,
      req,
    });
  }
}

async function resetPassword({ token, password }, req) {
  const record = await PasswordResetToken.findOne({ tokenHash: hashToken(token), usedAt: null });
  if (!record || record.expiresAt <= new Date()) {
    throw ApiError.badRequest("Reset link is invalid or expired");
  }
  const user = await User.findOne({ _id: record.userId, isArchive: false });
  if (!user) throw ApiError.badRequest("Reset link is invalid or expired");

  user.passwordHash = await hashPassword(password);
  await user.save();
  record.usedAt = new Date();
  await record.save();
  await Session.deleteMany({ userId: user._id });

  await auditService.log({
    actor: user,
    action: "reset_password",
    module: "auth",
    entity: "User",
    entityId: user._id,
    req,
  });
}

async function changePassword(user, { currentPassword, newPassword }, req) {
  const fresh = await User.findById(user._id).select("+passwordHash");
  const valid = await verifyPassword(fresh.passwordHash, currentPassword);
  if (!valid) throw ApiError.validation({ currentPassword: "Current password is incorrect" });

  fresh.passwordHash = await hashPassword(newPassword);
  await fresh.save();
  await Session.deleteMany({ userId: fresh._id });

  await auditService.log({
    actor: fresh,
    action: "change_password",
    module: "auth",
    entity: "User",
    entityId: fresh._id,
    req,
  });

  const { session, rawToken, accessToken } = await createSession(fresh, req);
  return { rawToken, accessToken, session };
}

async function refresh(rawToken) {
  if (!rawToken) throw ApiError.unauthorized("No refresh token provided");

  const session = await Session.findOne({ tokenHash: hashToken(rawToken) });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await session.deleteOne();
    throw ApiError.unauthorized("Session expired");
  }

  const user = await User.findOne({ _id: session.userId, isArchive: false }).populate("roleIds");
  if (!user || user.status === "disabled") {
    if (user) await Session.deleteMany({ userId: user._id });
    throw ApiError.unauthorized("Invalid session user");
  }

  session.lastSeenAt = new Date();
  await session.save();

  const accessToken = createAccessToken(user);
  return { user: await buildCurrentUser(user), rawToken, accessToken };
}

module.exports = {
  login,
  logout,
  me,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  createSession,
  getSettings,
};
