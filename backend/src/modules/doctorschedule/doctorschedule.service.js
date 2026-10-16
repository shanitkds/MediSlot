const mongoose = require("mongoose");
const DoctorSchedule = require("../../models/DoctorSchedule");
const Doctor = require("../../models/Doctor");
const ApiError = require("../../utils/ApiError");
const checkRole = require("../../utils/checkRole");
const auditService = require("../audit/audit.service");

/**
 * Converts HH:mm time string into minutes from start of day.
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Validates session time order and ensures no overlapping sessions.
 */
function validateSessions(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw ApiError.badRequest("At least one session is required");
  }

  const sorted = [...sessions].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);

    if (start >= end) {
      throw ApiError.badRequest(
        `Session start time (${s.startTime}) must be earlier than end time (${s.endTime})`
      );
    }

    if (i > 0) {
      const prevEnd = timeToMinutes(sorted[i - 1].endTime);
      if (start < prevEnd) {
        throw ApiError.badRequest(
          `Overlapping sessions detected between ${sorted[i - 1].startTime}-${sorted[i - 1].endTime} and ${s.startTime}-${s.endTime}`
        );
      }
    }
  }
}

/**
 * Validates break time order and ensures no overlapping breaks.
 */
function validateBreaks(breaks) {
  if (!breaks || !Array.isArray(breaks) || breaks.length === 0) return;

  const sorted = [...breaks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);

    if (start >= end) {
      throw ApiError.badRequest(
        `Break start time (${b.startTime}) must be earlier than end time (${b.endTime})`
      );
    }

    if (i > 0) {
      const prevEnd = timeToMinutes(sorted[i - 1].endTime);
      if (start < prevEnd) {
        throw ApiError.badRequest(
          `Overlapping breaks detected between ${sorted[i - 1].startTime}-${sorted[i - 1].endTime} and ${b.startTime}-${b.endTime}`
        );
      }
    }
  }
}

/**
 * Helper to populate doctor details on a schedule.
 */
async function getPopulatedScheduleById(scheduleId) {
  return DoctorSchedule.findById(scheduleId).populate({
    path: "doctorId",
    populate: [
      { path: "userId", select: "name email status isArchive" },
      { path: "departmentId", select: "name description isActive" },
    ],
  });
}

/**
 * API 1: Configure working days, sessions, breaks, and slot duration (Super Admin only).
 */
async function configureSchedule(payload, actor, req) {
  const { doctorId, workingDays, sessions, breaks, slotDurationMinutes } = payload;

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw ApiError.badRequest("Invalid doctorId format");
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  if (doctor.status === "disabled" || !doctor.isActive) {
    throw ApiError.badRequest("Cannot configure schedule for an inactive doctor");
  }

  const existingSchedule = await DoctorSchedule.findOne({ doctorId });
  if (existingSchedule) {
    throw ApiError.conflict("Doctor schedule already configured. Use PUT to update schedule.");
  }

  validateSessions(sessions);
  if (breaks && breaks.length > 0) {
    validateBreaks(breaks);
  }

  const schedule = await DoctorSchedule.create({
    doctorId,
    workingDays: workingDays || [1, 2, 3, 4, 5],
    sessions,
    breaks: breaks || [],
    slotDurationMinutes: slotDurationMinutes || doctor.consultationDuration || 15,
  });

  await auditService.log({
    actor,
    action: "configure_schedule",
    module: "doctorschedule",
    entity: "DoctorSchedule",
    entityId: schedule._id,
    req,
  });

  return getPopulatedScheduleById(schedule._id);
}

/**
 * API 2: View the doctor's schedule (Super Admin, Doctor [own schedule]).
 * Checks role using common checkRole function.
 */
async function getSchedule(queryOrParams = {}, actor, req) {
  const userOrReq = req || actor;

  // Single common checkRole check
  if (!checkRole(userOrReq, "Super Admin", "Doctor")) {
    throw ApiError.forbidden("Access denied: Super Admin or Doctor role required");
  }

  const isSuperAdmin = checkRole(userOrReq, "Super Admin");
  const isDoctor = checkRole(userOrReq, "Doctor");

  const requestedDoctorId = queryOrParams.doctorId;

  // Doctor: can ONLY view own schedule
  if (isDoctor && !isSuperAdmin) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await Doctor.findOne({ userId });
    if (!ownDoctor) {
      throw ApiError.notFound("Doctor profile not found for authenticated user");
    }

    if (requestedDoctorId && String(requestedDoctorId) !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only view their own schedule");
    }

    const schedule = await DoctorSchedule.findOne({ doctorId: ownDoctor._id }).populate({
      path: "doctorId",
      populate: [
        { path: "userId", select: "name email status isArchive" },
        { path: "departmentId", select: "name description isActive" },
      ],
    });

    if (!schedule) {
      throw ApiError.notFound("Schedule not configured for your doctor profile");
    }

    return schedule;
  }

  // Super Admin: can view any doctor's schedule or list all
  if (requestedDoctorId) {
    if (!mongoose.Types.ObjectId.isValid(requestedDoctorId)) {
      throw ApiError.badRequest("Invalid doctorId format");
    }

    const doctor = await Doctor.findById(requestedDoctorId);
    if (!doctor) {
      throw ApiError.notFound("Doctor not found");
    }

    const schedule = await DoctorSchedule.findOne({ doctorId: requestedDoctorId }).populate({
      path: "doctorId",
      populate: [
        { path: "userId", select: "name email status isArchive" },
        { path: "departmentId", select: "name description isActive" },
      ],
    });

    if (!schedule) {
      throw ApiError.notFound("Doctor schedule not found");
    }

    return schedule;
  }

  // Super Admin listing all doctor schedules when no specific doctorId is provided
  const schedules = await DoctorSchedule.find().populate({
    path: "doctorId",
    populate: [
      { path: "userId", select: "name email status isArchive" },
      { path: "departmentId", select: "name description isActive" },
    ],
  });

  return schedules;
}

/**
 * API 3: Update working days, sessions, breaks, and slot duration (Super Admin only).
 */
async function updateSchedule(doctorId, payload, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw ApiError.badRequest("Invalid doctorId format");
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  const schedule = await DoctorSchedule.findOne({ doctorId });
  if (!schedule) {
    throw ApiError.notFound("Doctor schedule not found. Use POST to configure initial schedule.");
  }

  if (payload.workingDays !== undefined) {
    schedule.workingDays = payload.workingDays;
  }

  if (payload.sessions !== undefined) {
    validateSessions(payload.sessions);
    schedule.sessions = payload.sessions;
  }

  if (payload.breaks !== undefined) {
    validateBreaks(payload.breaks);
    schedule.breaks = payload.breaks;
  }

  if (payload.slotDurationMinutes !== undefined) {
    schedule.slotDurationMinutes = payload.slotDurationMinutes;
  }

  await schedule.save();

  await auditService.log({
    actor,
    action: "update_schedule",
    module: "doctorschedule",
    entity: "DoctorSchedule",
    entityId: schedule._id,
    req,
  });

  return getPopulatedScheduleById(schedule._id);
}

module.exports = {
  configureSchedule,
  getSchedule,
  updateSchedule,
  timeToMinutes,
  validateSessions,
  validateBreaks,
};
