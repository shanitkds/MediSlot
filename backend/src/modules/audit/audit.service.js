const AuditLog = require("../../models/AuditLog");
const { parsePagination, paginationMeta } = require("../../utils/pagination");

function extractRole(actor, explicitRole) {
  if (explicitRole) return explicitRole;
  if (!actor) return "";
  if (typeof actor.role === "string" && actor.role) return actor.role;
  if (Array.isArray(actor.roles) && actor.roles.length) {
    return actor.roles
      .map((r) => (typeof r === "object" && r ? r.name || r.slug : String(r)))
      .filter(Boolean)
      .join(", ");
  }
  if (Array.isArray(actor.roleIds) && actor.roleIds.length) {
    return actor.roleIds
      .map((r) => (typeof r === "object" && r ? r.name || r.slug : String(r)))
      .filter(Boolean)
      .join(", ");
  }
  if (actor.isSuperAdmin) return "Super Admin";
  return "";
}

const logger = require("../../config/logger");

async function log({
  actor,
  userId,
  actorEmail,
  email,
  role,
  action,
  module = "general",
  entity,
  Entity,
  entityId,
  resourceId,
  resourceType = "",
  metadata,
}) {
  const resolvedRole = extractRole(actor, role);
  const resolvedEntity = entity || Entity || resourceType || "";
  const resolvedUser = userId || actor?._id || actor?.id || null;
  const resolvedEmail = actor?.email || actorEmail || email || metadata?.email || "";
  const resolvedEntityId = entityId || resourceId || null;

  try {
    await AuditLog.create({
      userId: resolvedUser,
      actorId: resolvedUser,
      actorEmail: resolvedEmail,
      role: resolvedRole,
      action,
      module,
      entity: resolvedEntity,
      entityId: resolvedEntityId,
      timestamp: new Date(),
    });
  } catch (err) {
    logger.warn({ err, action, module }, "Failed to write audit log entry");
  }
}

async function list(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.userId || query.actorId) {
    const uid = query.userId || query.actorId;
    filter.$or = [{ userId: uid }, { actorId: uid }];
  }
  if (query.role) filter.role = query.role;
  if (query.entity || query.Entity) {
    filter.entity = query.entity || query.Entity;
  }
  if (query.entityId) filter.entityId = query.entityId;
  if (query.module) filter.module = query.module;
  if (query.action) filter.action = query.action;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => ({
      id: String(item._id),
      userId: item.userId ? String(item.userId) : item.actorId ? String(item.actorId) : null,
      actorId: item.actorId ? String(item.actorId) : item.userId ? String(item.userId) : null,
      actorEmail: item.actorEmail,
      role: item.role || "",
      action: item.action,
      module: item.module,
      entity: item.entity || "",
      entityId: item.entityId ? String(item.entityId) : null,
      resourceType: item.entity || "",
      timestamp: item.timestamp || item.createdAt,
      createdAt: item.createdAt,
    })),
    pagination: paginationMeta({ page, limit, total }),
  };
}

module.exports = { log, list };
