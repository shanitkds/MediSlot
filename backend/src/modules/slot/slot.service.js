const mongoose = require("mongoose");
const Slot = require("../../models/Slot");
const Doctor = require("../../models/Doctor");
const DoctorSchedule = require("../../models/DoctorSchedule");
const ApiError = require("../../utils/ApiError");
const checkRole = require("../../utils/checkRole");
const { paginate } = require("../../utils/pagination");
const auditService = require("../audit/audit.service");

/**
 * Builds Date object on baseDate (YYYY-MM-DD) with HH:mm time.
 */
function createDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}

/**
 * Normalizes day of week to 1=Mon ... 7=Sun (also compatible with 0=Sun).
 */
function isDateInWorkingDays(dateObj, workingDays = []) {
  const jsDay = dateObj.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const isoDay = jsDay === 0 ? 7 : jsDay; // 1 = Monday, ..., 7 = Sunday
  return workingDays.includes(jsDay) || workingDays.includes(isoDay);
}

/**
 * Generates slot intervals for a doctor on a given date based on their schedule.
 */
function calculateSlotIntervals(doctorId, dateStr, schedule) {
  const slots = [];
  const slotMs = (schedule.slotDurationMinutes || 15) * 60 * 1000;

  for (const session of schedule.sessions || []) {
    const sStartStr = session.startTime || session.start;
    const sEndStr = session.endTime || session.end;
    if (!sStartStr || !sEndStr) continue;

    let currStart = createDateTime(dateStr, sStartStr);
    const sessionEnd = createDateTime(dateStr, sEndStr);

    while (currStart.getTime() + slotMs <= sessionEnd.getTime()) {
      const currEnd = new Date(currStart.getTime() + slotMs);

      // Check break overlaps
      const overlapsBreak = (schedule.breaks || []).some((b) => {
        const bStartStr = b.startTime || b.start;
        const bEndStr = b.endTime || b.end;
        if (!bStartStr || !bEndStr) return false;
        const bStart = createDateTime(dateStr, bStartStr);
        const bEnd = createDateTime(dateStr, bEndStr);
        return currStart < bEnd && currEnd > bStart;
      });

      if (!overlapsBreak) {
        slots.push({
          doctorId: new mongoose.Types.ObjectId(doctorId),
          startAt: currStart,
          endAt: currEnd,
          status: "available",
        });
      }

      currStart = currEnd;
    }
  }

  return slots;
}

/**
 * API 1: Generate slots from a doctor's schedule for a specific date.
 */
async function generateSlots(payload, actor, req) {
  const { doctorId, date } = payload;

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw ApiError.badRequest("Invalid doctorId format");
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }
  if (doctor.status === "disabled" || !doctor.isActive) {
    throw ApiError.badRequest("Cannot generate slots for an inactive doctor");
  }

  const schedule = await DoctorSchedule.findOne({ doctorId });
  if (!schedule) {
    throw ApiError.notFound("Doctor schedule not found. Configure schedule first.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  if (!isDateInWorkingDays(targetDate, schedule.workingDays)) {
    throw ApiError.badRequest(`Doctor is not scheduled to work on date ${date}`);
  }

  const candidateSlots = calculateSlotIntervals(doctorId, date, schedule);
  if (candidateSlots.length === 0) {
    throw ApiError.badRequest("No working sessions available on this date to generate slots");
  }

  // Remove any stale unbooked available slots that are no longer valid under current sessions/breaks
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  const candidateTimes = new Set(candidateSlots.map((s) => s.startAt.getTime()));

  const staleAvailableSlots = await Slot.find({
    doctorId,
    startAt: { $gte: dayStart, $lte: dayEnd },
    status: "available",
  });

  for (const oldSlot of staleAvailableSlots) {
    if (!candidateTimes.has(oldSlot.startAt.getTime())) {
      await Slot.deleteOne({ _id: oldSlot._id });
    }
  }

  const createdSlots = [];
  for (const slotData of candidateSlots) {
    const existing = await Slot.findOne({
      doctorId: slotData.doctorId,
      startAt: slotData.startAt,
    });

    if (!existing) {
      const created = await Slot.create(slotData);
      createdSlots.push(created);
    } else {
      createdSlots.push(existing);
    }
  }

  await auditService.log({
    actor,
    action: "generate_slots",
    module: "slots",
    entity: "Slot",
    entityId: doctorId,
    req,
  });

  return createdSlots.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

/**
 * API 2: List available and booked slots with optional doctor own-schedule guard.
 */
async function listSlots(query = {}, actor, req) {
  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");

  const filter = {};

  // Role check: Doctors may only view their own slots
  if (isDoctor && !isSuperAdmin) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await Doctor.findOne({ userId });
    if (!ownDoctor) {
      throw ApiError.notFound("Doctor profile not found for authenticated user");
    }

    if (query.doctorId && String(query.doctorId) !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only view their own slots");
    }

    filter.doctorId = ownDoctor._id;
  } else if (query.doctorId) {
    if (!mongoose.Types.ObjectId.isValid(query.doctorId)) {
      throw ApiError.badRequest("Invalid doctorId format");
    }
    filter.doctorId = query.doctorId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  const now = new Date();

  if (query.date) {
    const [year, month, day] = query.date.split("-").map(Number);
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    if (query.onlyFuture) {
      const minStart = new Date(Math.max(dayStart.getTime(), now.getTime()));
      filter.startAt = { $gt: now, $gte: minStart, $lte: dayEnd };
    } else {
      filter.startAt = { $gte: dayStart, $lte: dayEnd };
    }
  } else if (query.startDate || query.endDate) {
    filter.startAt = {};
    if (query.startDate) filter.startAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.startAt.$lte = new Date(query.endDate);
    if (query.onlyFuture) {
      filter.startAt.$gt = now;
    }
  } else if (query.onlyFuture) {
    filter.startAt = { $gt: now };
  }

  return paginate(Slot, query, {
    baseFilter: filter,
    allowedSort: ["startAt", "endAt", "status", "createdAt"],
    populate: [
      {
        path: "doctorId",
        select: "specialization consultationDuration status isActive userId departmentId",
        populate: [
          { path: "userId", select: "name email status" },
          { path: "departmentId", select: "name description" },
        ],
      },
    ],
  });
}

/**
 * API 3: Check a specific slot's details and availability.
 */
async function getSlotById(id, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid slot ID format");
  }

  const slot = await Slot.findById(id).populate({
    path: "doctorId",
    select: "specialization consultationDuration status isActive userId departmentId",
    populate: [
      { path: "userId", select: "name email status" },
      { path: "departmentId", select: "name description" },
    ],
  });

  if (!slot) {
    throw ApiError.notFound("Slot not found");
  }

  // Doctor role check: can only check availability for own slots
  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");

  if (isDoctor && !isSuperAdmin) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await Doctor.findOne({ userId });
    const slotDoctorId = String(slot.doctorId?._id || slot.doctorId);

    if (!ownDoctor || slotDoctorId !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only check availability for their own slots");
    }
  }

  return slot;
}

/**
 * API 4: Update slot status when needed.
 */
async function updateSlotStatus(id, payload, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid slot ID format");
  }

  const slot = await Slot.findById(id);
  if (!slot) {
    throw ApiError.notFound("Slot not found");
  }

  slot.status = payload.status;
  await slot.save();

  await auditService.log({
    actor,
    action: "update_slot_status",
    module: "slots",
    entity: "Slot",
    entityId: slot._id,
    req,
  });

  return getSlotById(slot._id, actor, req);
}

/**
 * API 5: Regenerate slots after schedule changes while preserving booked appointments.
 */
async function regenerateSlots(payload, actor, req) {
  const { doctorId, date } = payload;

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw ApiError.badRequest("Invalid doctorId format");
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  const schedule = await DoctorSchedule.findOne({ doctorId });
  if (!schedule) {
    throw ApiError.notFound("Doctor schedule not found. Configure schedule first.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // 1. Find all already booked slots to preserve patient appointments
  const bookedSlots = await Slot.find({
    doctorId,
    startAt: { $gte: dayStart, $lte: dayEnd },
    status: "booked",
  });

  // 2. Delete existing available slots for that date
  await Slot.deleteMany({
    doctorId,
    startAt: { $gte: dayStart, $lte: dayEnd },
    status: "available",
  });

  // 3. If target date is not a working day, keep booked slots and return
  if (!isDateInWorkingDays(targetDate, schedule.workingDays)) {
    return bookedSlots;
  }

  // 4. Calculate fresh candidate slots from updated schedule
  const candidateSlots = calculateSlotIntervals(doctorId, date, schedule);

  const activeSlots = [...bookedSlots];
  for (const candidate of candidateSlots) {
    // Ensure candidate doesn't overlap with any existing booked slot
    const overlapsBooked = bookedSlots.some(
      (b) => candidate.startAt < b.endAt && candidate.endAt > b.startAt
    );

    if (!overlapsBooked) {
      const created = await Slot.create(candidate);
      activeSlots.push(created);
    }
  }

  await auditService.log({
    actor,
    action: "regenerate_slots",
    module: "slots",
    entity: "Slot",
    entityId: doctorId,
    req,
  });

  return activeSlots.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

module.exports = {
  generateSlots,
  listSlots,
  getSlotById,
  updateSlotStatus,
  regenerateSlots,
  createDateTime,
  calculateSlotIntervals,
  isDateInWorkingDays,
};
