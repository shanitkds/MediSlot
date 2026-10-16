const mongoose = require("mongoose");
const Doctor = require("../../models/Doctor");
const User = require("../../models/User");
const Department = require("../../models/Department");
const Appointment = require("../../models/Appointment");
const DoctorSchedule = require("../../models/DoctorSchedule");
const Slot = require("../../models/Slot");
const Session = require("../../models/Session");
const ApiError = require("../../utils/ApiError");
const { paginate } = require("../../utils/pagination");
const auditService = require("../audit/audit.service");
const userService = require("../users/user.service");

async function findDoctorByIdOrUserId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid ID format");
  }
  const doctor = await Doctor.findOne({
    $or: [{ _id: id }, { userId: id }],
  })
    .populate("userId", "name email status isArchive")
    .populate("departmentId", "name description isActive");

  if (!doctor) {
    throw ApiError.notFound("Doctor profile not found");
  }
  return doctor;
}

async function create(payload, actor, req) {
  let doctorDoc;
  if (payload.userId) {
    const dept = await Department.findById(payload.departmentId);
    if (!dept) throw ApiError.badRequest("Invalid departmentId: Department not found");
    if (!dept.isActive) throw ApiError.badRequest("Cannot assign an inactive department");

    const existingDoctor = await Doctor.findOne({ userId: payload.userId });
    if (existingDoctor) throw ApiError.conflict("A doctor profile already exists for this user");

    doctorDoc = await Doctor.create({
      userId: payload.userId,
      departmentId: payload.departmentId,
      specialization: payload.specialization.trim(),
      consultationDuration: payload.consultationDuration || 15,
      status: "active",
      isActive: true,
    });
  } else {
    // Create doctor user credentials and profile via user service
    const user = await userService.createDoctor(payload, actor, req);
    doctorDoc = await Doctor.findOne({ userId: user.id });
  }

  await auditService.log({
    actor,
    action: "create",
    module: "doctors",
    entity: "Doctor",
    entityId: doctorDoc._id,
    req,
  });

  return getById(doctorDoc._id);
}

async function list(query = {}) {
  if (query.departmentId && !mongoose.Types.ObjectId.isValid(query.departmentId)) {
    throw ApiError.badRequest("Invalid departmentId format");
  }

  return paginate(Doctor, query, {
    exactFields: ["departmentId", "status"],
    regexFields: ["specialization"],
    allowedSort: ["createdAt", "specialization", "consultationDuration", "status"],
    populate: [
      { path: "userId", select: "name email status isArchive" },
      { path: "departmentId", select: "name description isActive" },
    ],
    customFilter: async (filter) => {
      if (query.search) {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: query.search, $options: "i" } },
            { email: { $regex: query.search, $options: "i" } },
          ],
          isArchive: false,
        }).select("_id");

        const userIds = matchingUsers.map((u) => u._id);
        filter.$or = [
          { specialization: { $regex: query.search, $options: "i" } },
          { userId: { $in: userIds } },
        ];
      }
    },
  });
}

async function getById(id) {
  const doctor = await findDoctorByIdOrUserId(id);
  return doctor;
}

async function update(id, payload, actor, req) {
  const doctor = await findDoctorByIdOrUserId(id);
  const doctorUserId = String(doctor.userId?._id || doctor.userId);

  if (payload.name) {
    const user = await User.findById(doctorUserId);
    if (user) {
      user.name = payload.name.trim();
      await user.save();
    }
  }

  const duration = payload.consultationDuration !== undefined 
    ? payload.consultationDuration 
    : payload.slotDurationMinutes;
  if (duration !== undefined) {
    doctor.consultationDuration = duration;
  }

  if (payload.specialization) {
    doctor.specialization = payload.specialization.trim();
  }

  if (payload.departmentId) {
    const department = await Department.findById(payload.departmentId);
    if (!department) {
      throw ApiError.badRequest("Invalid departmentId: Department not found");
    }
    if (!department.isActive) {
      throw ApiError.badRequest("Cannot assign an inactive department");
    }
    doctor.departmentId = department._id;
  }

  if (payload.status) {
    doctor.status = payload.status;
    doctor.isActive = payload.status === "active";
    const user = await User.findById(doctorUserId);
    if (user) {
      user.status = payload.status;
      if (payload.status === "active") {
        user.isArchive = false;
      }
      await user.save();
    }
  }

  await doctor.save();

  await auditService.log({
    actor,
    action: "update",
    module: "doctors",
    entity: "Doctor",
    entityId: doctor._id,
    req,
  });

  return getById(doctor._id);
}

async function updateSpecialization(id, specialization, actor, req) {
  const doctor = await findDoctorByIdOrUserId(id);
  doctor.specialization = specialization.trim();
  await doctor.save();

  await auditService.log({
    actor,
    action: "update_specialization",
    module: "doctors",
    entity: "Doctor",
    entityId: doctor._id,
    req,
  });

  return getById(doctor._id);
}

async function updateDepartment(id, departmentId, actor, req) {
  const doctor = await findDoctorByIdOrUserId(id);

  const department = await Department.findById(departmentId);
  if (!department) {
    throw ApiError.badRequest("Invalid departmentId: Department not found");
  }
  if (!department.isActive) {
    throw ApiError.badRequest("Cannot assign an inactive department");
  }

  doctor.departmentId = department._id;
  await doctor.save();

  await auditService.log({
    actor,
    action: "update_department",
    module: "doctors",
    entity: "Doctor",
    entityId: doctor._id,
    req,
  });

  return getById(doctor._id);
}

async function deactivate(id, actor, req) {
  const doctor = await findDoctorByIdOrUserId(id);

  // Check appointment history
  const appointmentCount = await Appointment.countDocuments({ doctorId: doctor._id });
  const isPermanent = req?.query?.permanent === "true" || req?.query?.force === "true";
  const doctorUserId = doctor.userId?._id || doctor.userId;

  let actionType = "deactivate";
  let deleted = false;

  if (isPermanent) {
    if (appointmentCount > 0) {
      throw ApiError.badRequest(
        `Cannot permanently delete doctor with ${appointmentCount} existing appointment(s). Doctor profile has been deactivated instead to preserve appointment records.`
      );
    }

    // Clean up schedule and unbooked slots
    await DoctorSchedule.deleteMany({ doctorId: doctor._id });
    await Slot.deleteMany({ doctorId: doctor._id, status: "available" });
    await Doctor.findByIdAndDelete(doctor._id);
    actionType = "delete";
    deleted = true;

    // Archive user and revoke sessions
    const user = await User.findById(doctorUserId);
    if (user) {
      user.status = "disabled";
      user.isArchive = true;
      await user.save();
    }
  } else {
    // Deactivate doctor record
    doctor.status = "disabled";
    doctor.isActive = false;
    await doctor.save();

    // Keep User record consistent: deactivate user and revoke sessions
    const user = await User.findById(doctorUserId);
    if (user) {
      user.status = "disabled";
      await user.save();
    }
  }

  await Session.deleteMany({ userId: doctorUserId });

  await auditService.log({
    actor,
    action: actionType,
    module: "doctors",
    entity: "Doctor",
    entityId: doctor._id,
    req,
  });

  return {
    doctor: deleted ? null : await getById(doctor._id),
    appointmentCount,
    deleted,
    actionType,
  };
}

module.exports = {
  create,
  list,
  getById,
  update,
  updateSpecialization,
  updateDepartment,
  deactivate,
};
