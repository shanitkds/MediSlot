const Session = require("../../models/Session");
const ApiError = require("../../utils/ApiError");
const auditService = require("../audit/audit.service");

async function listForUser(userId, currentSessionId) {
  const sessions = await Session.find({ userId }).sort({ lastSeenAt: -1 }).lean();
  return sessions.map((session) => ({
    id: String(session._id),
    userAgent: session.userAgent,
    ip: session.ip,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    current: currentSessionId ? String(session._id) === String(currentSessionId) : false,
  }));
}

async function revoke(sessionId, actor, req, { userId } = {}) {
  const filter = { _id: sessionId };
  if (userId) filter.userId = userId;
  const session = await Session.findOne(filter);
  if (!session) throw ApiError.notFound("Session not found");
  await session.deleteOne();
  await auditService.log({
    actor,
    action: "revoke_session",
    module: "sessions",
    entity: "Session",
    entityId: sessionId,
    req,
  });
}

async function revokeAll(userId, actor, req, exceptId) {
  const filter = { userId };
  if (exceptId) filter._id = { $ne: exceptId };
  await Session.deleteMany(filter);
  await auditService.log({
    actor,
    action: "logout_all",
    module: "sessions",
    entity: "User",
    entityId: userId,
    req,
  });
}

module.exports = { listForUser, revoke, revokeAll };
