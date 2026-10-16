const mongoose = require("mongoose");
const Department = require("../../models/Department");
const Doctor = require("../../models/Doctor");
const Appointment = require("../../models/Appointment");
const ApiError = require("../../utils/ApiError");
const { paginate } = require("../../utils/pagination");
const auditService = require("../audit/audit.service");

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

async function findDepartmentById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid ID format");
  }
  const department = await Department.findById(id);
  if (!department) {
    throw ApiError.notFound("Department not found");
  }
  return department;
}

/**
 * Asserts that a department can be safely deactivated.
 * Throws ApiError.badRequest if active doctors or future scheduled appointments exist.
 */
async function assertDepartmentCanBeDeactivated(departmentId) {
  // 1. Check for active doctors in this department
  const activeDoctorsCount = await Doctor.countDocuments({
    departmentId,
    status: "active",
    isActive: true,
  });
  if (activeDoctorsCount > 0) {
    throw ApiError.badRequest(
      `Cannot deactivate department: ${activeDoctorsCount} active doctor(s) are assigned to this department. Please reassign or deactivate them first.`
    );
  }

  // 2. Check for upcoming/future scheduled appointments
  const futureAppointmentsCount = await Appointment.countDocuments({
    departmentId,
    status: "scheduled",
    $or: [
      { appointmentDate: { $gte: new Date() } },
      { appointmentDate: null },
    ],
  });
  if (futureAppointmentsCount > 0) {
    throw ApiError.badRequest(
      `Cannot deactivate department: ${futureAppointmentsCount} upcoming scheduled appointment(s) exist. Please reschedule or cancel them first.`
    );
  }
}

/**
 * Create a new department with unique name validation.
 */
async function create(payload, actor, req) {
  const trimmedName = payload.name.trim();

  // Validate duplicate department name (case-insensitive)
  const existing = await Department.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
  });
  if (existing) {
    throw ApiError.conflict("Department with this name already exists");
  }

  const department = await Department.create({
    name: trimmedName,
    description: payload.description ? payload.description.trim() : "",
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  });

  await auditService.log({
    actor,
    action: "create",
    module: "departments",
    entity: "Department",
    entityId: department._id,
    req,
  });

  return department;
}

/**
 * List departments supporting search, isActive filter, sort, and pagination via common paginate helper.
 */
async function list(query = {}) {
  return paginate(Department, query, {
    searchFields: ["name", "description"],
    booleanFields: ["isActive"],
    allowedSort: ["createdAt", "name", "isActive"],
  });
}

/**
 * Get department details by ID.
 */
async function getById(id) {
  return findDepartmentById(id);
}

/**
 * Update department fields with uniqueness check and deactivation guard.
 */
async function update(id, payload, actor, req) {
  const department = await findDepartmentById(id);

  if (payload.name) {
    const trimmedName = payload.name.trim();
    const existing = await Department.findOne({
      _id: { $ne: department._id },
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
    });
    if (existing) {
      throw ApiError.conflict("Department with this name already exists");
    }
    department.name = trimmedName;
  }

  if (payload.description !== undefined) {
    department.description = payload.description.trim();
  }

  if (payload.isActive !== undefined) {
    // If deactivating an active department, ensure no active doctors or future appointments exist
    if (department.isActive && payload.isActive === false) {
      await assertDepartmentCanBeDeactivated(department._id);
    }
    department.isActive = payload.isActive;
  }

  await department.save();

  await auditService.log({
    actor,
    action: "update",
    module: "departments",
    entity: "Department",
    entityId: department._id,
    req,
  });

  return department;
}

/**
 * Delete or deactivate department.
 * - Guards against deactivation if active doctors or future appointments exist.
 * - Deletes from database if zero doctor and appointment references exist.
 * - Otherwise deactivates (isActive = false) to preserve appointment and doctor history.
 */
async function deleteOrDeactivate(id, actor, req) {
  const department = await findDepartmentById(id);

  // If currently active, verify safe deactivation
  if (department.isActive) {
    await assertDepartmentCanBeDeactivated(department._id);
  }

  const [totalDoctors, totalAppointments] = await Promise.all([
    Doctor.countDocuments({ departmentId: department._id }),
    Appointment.countDocuments({ departmentId: department._id }),
  ]);

  let actionType = "deactivate";
  let deleted = false;

  if (totalDoctors === 0 && totalAppointments === 0) {
    await Department.findByIdAndDelete(department._id);
    actionType = "delete";
    deleted = true;
  } else {
    department.isActive = false;
    await department.save();
  }

  await auditService.log({
    actor,
    action: actionType,
    module: "departments",
    entity: "Department",
    entityId: department._id,
    req,
  });

  return {
    department: deleted ? null : department,
    deleted,
    actionType,
  };
}

module.exports = {
  create,
  list,
  getById,
  update,
  deleteOrDeactivate,
  assertDepartmentCanBeDeactivated,
};
