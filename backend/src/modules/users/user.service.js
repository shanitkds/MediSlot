const User = require("../../models/User");
const Role = require("../../models/Role");
const Doctor = require("../../models/Doctor");
const Department = require("../../models/Department");
const Session = require("../../models/Session");
const ApiError = require("../../utils/ApiError");
const { hashPassword } = require("../../utils/hash");
const { parsePagination, paginationMeta, parseSort, paginate } = require("../../utils/pagination");
const auditService = require("../audit/audit.service");

function notDeleted(extra = {}) {
  return { isArchive: { $ne: true }, ...extra };
}

async function ensureRolesExist(roleIds = []) {
  if (!roleIds.length) return [];
  const roles = await Role.find({ _id: { $in: roleIds }, deletedAt: null });
  if (roles.length !== roleIds.length) throw ApiError.validation({ roleIds: "One or more roles are invalid" });
  return roles;
}

async function getOrCreateRole(slug, name) {
  let role = await Role.findOne({ slug, deletedAt: null });
  if (!role) {
    role = await Role.create({
      name,
      slug,
      isSystem: true,
      isSuperAdmin: false,
      permissionIds: [],
    });
  }
  return role;
}

async function lastSuperAdminGuard(userId) {
  const superRoles = await Role.find({ isSuperAdmin: true, deletedAt: null }).select("_id");
  const superRoleIds = superRoles.map((role) => role._id);
  const remaining = await User.countDocuments(
    notDeleted({
      _id: { $ne: userId },
      roleIds: { $in: superRoleIds },
      status: { $ne: "disabled" },
    })
  );
  return remaining;
}

async function list(query = {}) {
  return paginate(User, query, {
    baseFilter: { isArchive: { $ne: true } },
    booleanFields: ["isArchive"],
    exactFields: { status: "status", roleId: "roleIds" },
    searchFields: ["name", "email"],
    allowedSort: ["createdAt", "name", "email", "status", "isArchive"],
    populate: ["roleIds", "doctor"],
  });
}

async function getById(id) {
  const user = await User.findOne({ _id: id })
    .populate("roleIds")
    .populate("doctor");
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

async function createDoctor(payload, actor, req) {
  const existing = await User.findOne(notDeleted({ email: payload.email.toLowerCase() }));
  if (existing) {
    throw ApiError.conflict(`An account with email "${payload.email}" already exists`, {
      email: "An account with this email address already exists",
    });
  }

  const doctorRole = await getOrCreateRole("doctor", "Doctor");
  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash: await hashPassword(payload.password),
    status: "active",
    isArchive: false,
    roleIds: [doctorRole._id],
  });

  if (payload.departmentId && payload.specialization) {
    const dept = await Department.findById(payload.departmentId);
    if (!dept) throw ApiError.badRequest("Invalid departmentId: Department not found");
    if (!dept.isActive) throw ApiError.badRequest("Cannot assign an inactive department");

    await Doctor.create({
      userId: user._id,
      departmentId: payload.departmentId,
      specialization: payload.specialization,
      consultationDuration: payload.consultationDuration || 15,
      status: "active",
      isActive: true,
    });
  }

  await auditService.log({
    actor,
    action: "create_doctor",
    module: "users",
    entity: "User",
    entityId: user._id,
    req,
  });

  return getById(user._id);
}

async function createReceptionist(payload, actor, req) {
  const existing = await User.findOne(notDeleted({ email: payload.email.toLowerCase() }));
  if (existing) {
    throw ApiError.conflict(`An account with email "${payload.email}" already exists`, {
      email: "An account with this email address already exists",
    });
  }

  const receptionistRole = await getOrCreateRole("receptionist", "Receptionist");
  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash: await hashPassword(payload.password),
    status: "active",
    isArchive: false,
    roleIds: [receptionistRole._id],
  });

  await auditService.log({
    actor,
    action: "create_receptionist",
    module: "users",
    entity: "User",
    entityId: user._id,
    req,
  });

  return getById(user._id);
}

async function update(id, payload, actor, req) {
  const user = await User.findOne({ _id: id });
  if (!user) throw ApiError.notFound("User not found");

  if (payload.roleIds) {
    const roles = await ensureRolesExist(payload.roleIds);
    const stillSuper = roles.some((role) => role.isSuperAdmin);
    if (!stillSuper && (await lastSuperAdminGuard(user._id)) === 0) {
      throw ApiError.forbidden("Cannot remove the last Super Admin");
    }
    user.roleIds = roles.map((role) => role._id);
  }

  if (payload.name) user.name = payload.name;
  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const existing = await User.findOne(notDeleted({ email: payload.email.toLowerCase(), _id: { $ne: user._id } }));
    if (existing) {
      throw ApiError.conflict(`An account with email "${payload.email}" already exists`, {
        email: "An account with this email address already exists",
      });
    }
    user.email = payload.email.toLowerCase();
  }
  if (payload.password) {
    user.passwordHash = await hashPassword(payload.password);
  }

  await user.save();
  await auditService.log({
    actor,
    action: "update",
    module: "users",
    entity: "User",
    entityId: user._id,
    req,
  });
  return getById(user._id);
}

async function updateStatus(id, status, actor, req) {
  const user = await User.findOne({ _id: id });
  if (!user) throw ApiError.notFound("User not found");

  if (String(actor._id) === String(user._id) && status === "disabled") {
    throw ApiError.forbidden("You cannot disable your own account");
  }

  if (status === "disabled") {
    if ((await lastSuperAdminGuard(user._id)) === 0) {
      throw ApiError.forbidden("Cannot disable the last Super Admin");
    }
    await Session.deleteMany({ userId: user._id });
  }

  user.status = status;
  await user.save();

  await auditService.log({
    actor,
    action: status === "active" ? "activate" : "deactivate",
    module: "users",
    entity: "User",
    entityId: user._id,
    req,
  });

  return getById(user._id);
}

async function remove(id, actor, req) {
  if (String(actor._id) === String(id)) throw ApiError.forbidden("You cannot delete your own account");
  const user = await User.findOne(notDeleted({ _id: id }));
  if (!user) throw ApiError.notFound("User not found");
  if ((await lastSuperAdminGuard(user._id)) === 0) {
    throw ApiError.forbidden("Cannot delete the last Super Admin");
  }
  user.isArchive = true;
  await user.save();
  await Session.deleteMany({ userId: user._id });
  await auditService.log({
    actor,
    action: "delete",
    module: "users",
    entity: "User",
    entityId: user._id,
    req,
  });
}

module.exports = {
  list,
  getById,
  createDoctor,
  createReceptionist,
  update,
  updateStatus,
  remove,
};
