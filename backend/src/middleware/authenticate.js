const env = require("../config/env");
const Session = require("../models/Session");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { hashToken } = require("../utils/hash");
const { verifyAccessToken } = require("../utils/tokens");
const { resolveAccess } = require("../modules/auth/auth.access");

async function authenticate(req, res, next) {
  try {
    const rawSession = req.cookies?.[env.COOKIE_NAME];
    const authHeader = req.headers?.authorization;
    let bearerToken = null;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    }
    const accessCookie = req.cookies?.access_token;

    let user = null;
    let session = null;

    // 1. Try resolving via Bearer JWT or access_token cookie
    const tokenToVerify = bearerToken || accessCookie;
    if (tokenToVerify) {
      const decoded = verifyAccessToken(tokenToVerify);
      if (decoded && decoded.userId) {
        user = await User.findOne({ _id: decoded.userId, isArchive: false }).populate("roleIds");
      }
    }

    // 2. If not resolved via JWT, try session lookup via rawSession or bearerToken (if opaque)
    if (!user) {
      const candidateRaw =
        rawSession || (bearerToken && !bearerToken.includes(".") ? bearerToken : null);
      if (candidateRaw) {
        session = await Session.findOne({ tokenHash: hashToken(candidateRaw) });
        if (!session) throw ApiError.unauthorized("Session expired");
        if (session.expiresAt <= new Date()) {
          await session.deleteOne();
          throw ApiError.unauthorized("Session expired");
        }

        const idleMs = env.IDLE_TTL_HOURS * 60 * 60 * 1000;
        if (Date.now() - new Date(session.lastSeenAt).getTime() > idleMs) {
          await session.deleteOne();
          throw ApiError.unauthorized("Session expired");
        }

        user = await User.findOne({ _id: session.userId, isArchive: false }).populate("roleIds");
        if (!user) {
          await session.deleteOne();
          throw ApiError.unauthorized();
        }

        session.lastSeenAt = new Date();
        await session.save();
      }
    }

    if (!user) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (user.status === "disabled") {
      await Session.deleteMany({ userId: user._id });
      throw ApiError.forbidden("Account is disabled");
    }

    const access = await resolveAccess(user);
    req.user = user;
    req.sessionDoc = session;
    req.permissions = access.permissions;
    req.isSuperAdmin = access.isSuperAdmin;
    req.roles = access.roles;

    if (!req.isSuperAdmin) {
      const Settings = require("../models/Settings");
      const settings = await Settings.findOne({ key: "app" }).lean();
      if (settings?.maintenanceMode && !req.path.startsWith("/api/v1/auth")) {
        throw ApiError.maintenance();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

function optionalAuthenticate(req, res, next) {
  const raw =
    req.cookies?.[env.COOKIE_NAME] ||
    req.headers?.authorization ||
    req.cookies?.access_token;
  if (!raw) return next();
  return authenticate(req, res, next);
}

module.exports = { authenticate, optionalAuthenticate };
