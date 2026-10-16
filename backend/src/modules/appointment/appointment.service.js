const mongoose = require("mongoose");
const Appointment = require("../../models/Appointment");
const Slot = require("../../models/Slot");
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Department = require("../../models/Department");
const ApiError = require("../../utils/ApiError");
const checkRole = require("../../utils/checkRole");
const { paginate } = require("../../utils/pagination");
const auditService = require("../audit/audit.service");
const { emitAppointmentEvent } = require("../../socket");

const POPULATE_FIELDS = [
  {
    path: "patientId",
    select: "patientId name mobile dateOfBirth gender status isActive",
  },
  {
    path: "doctorId",
    select: "specialization consultationDuration status isActive userId departmentId",
    populate: [
      { path: "userId", select: "name email status" },
      { path: "departmentId", select: "name description" },
    ],
  },
  {
    path: "departmentId",
    select: "name description isActive",
  },
  {
    path: "slotId",
    select: "startAt endAt status",
  },
  {
    path: "bookedBy",
    select: "name email",
  },
];

/**
 * Resolves doctor profile for authenticated user if they have the Doctor role.
 */
async function getDoctorForUser(userId) {
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    throw ApiError.notFound("Doctor profile not found for authenticated user");
  }
  return doctor;
}

/**
 * 1. POST / - Book an appointment with atomic slot reservation to prevent double-booking.
 */
async function bookAppointment(payload, actor, req) {
  const { patientId, doctorId, slotId, purpose, notes, appointmentDate } = payload;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw ApiError.badRequest("Invalid patientId format");
  }
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw ApiError.badRequest("Invalid doctorId format");
  }
  if (!mongoose.Types.ObjectId.isValid(slotId)) {
    throw ApiError.badRequest("Invalid slotId format");
  }

  // 1. Validate Patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw ApiError.notFound("Patient not found");
  }
  if (!patient.isActive || patient.status === "inactive") {
    throw ApiError.badRequest("Cannot book appointment for a deactivated patient");
  }

  // 2. Validate Doctor
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }
  if (!doctor.isActive || doctor.status === "disabled") {
    throw ApiError.badRequest("Cannot book appointment with an inactive doctor");
  }

  // 3. Validate Department
  const departmentId = payload.departmentId || doctor.departmentId;
  if (departmentId) {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw ApiError.notFound("Department not found");
    }
    if (!department.isActive) {
      throw ApiError.badRequest("Cannot book appointment with an inactive department");
    }
  }

  // 4. Atomic slot reservation for future available slot (Prevents double booking and past slot booking)
  const now = new Date();
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, doctorId, status: "available", startAt: { $gt: now } },
    { $set: { status: "booked" } },
    { new: true }
  );

  if (!slot) {
    const existingSlot = await Slot.findById(slotId);
    if (!existingSlot) {
      throw ApiError.notFound("Slot not found");
    }
    if (String(existingSlot.doctorId) !== String(doctorId)) {
      throw ApiError.badRequest("Slot does not belong to the specified doctor");
    }
    if (new Date(existingSlot.startAt) <= now) {
      throw ApiError.badRequest("Cannot book a past time slot. Please select an upcoming consultation slot.");
    }
    throw ApiError.conflict("Slot is already booked or unavailable");
  }

  // 5. Create Appointment document
  try {
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      departmentId: departmentId || null,
      slotId: slot._id,
      purpose: purpose || "",
      notes: notes || "",
      status: "scheduled",
      bookedBy: actor?._id || null,
      appointmentDate: appointmentDate || slot.startAt,
    });

    await auditService.log({
      actor,
      action: "book_appointment",
      module: "appointments",
      entity: "Appointment",
      entityId: appointment._id,
      req,
    });

    const result = await getAppointmentById(appointment._id, actor, req);
    emitAppointmentEvent("appointment:created", {
      appointment: result,
      appointmentId: result._id,
      doctorId: result.doctorId?._id || result.doctorId,
      status: result.status,
      changedFields: {
        status: result.status,
        patientId: result.patientId?._id || result.patientId,
        doctorId: result.doctorId?._id || result.doctorId,
        slotId: result.slotId?._id || result.slotId,
        appointmentDate: result.appointmentDate,
        purpose: result.purpose,
        notes: result.notes,
      },
    });
    return result;
  } catch (err) {
    // Rollback atomic slot reservation if appointment creation fails
    await Slot.findByIdAndUpdate(slotId, { status: "available" });
    throw err;
  }
}

/**
 * 2. GET / - List, filter, sort, and paginate appointments.
 * Doctors are restricted to their own appointments using the common checkRole function.
 */
async function listAppointments(query = {}, actor, req) {
  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");
  const isReceptionist = checkRole(userOrReq, "Receptionist");

  const filter = {};

  // Role check: Doctors may only view their own appointments
  if (isDoctor && !isSuperAdmin && !isReceptionist) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await getDoctorForUser(userId);

    if (query.doctorId && String(query.doctorId) !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only view their own appointments");
    }

    filter.doctorId = ownDoctor._id;
  } else if (query.doctorId) {
    if (!mongoose.Types.ObjectId.isValid(query.doctorId)) {
      throw ApiError.badRequest("Invalid doctorId format");
    }
    filter.doctorId = query.doctorId;
  }

  if (query.patientId) {
    if (mongoose.Types.ObjectId.isValid(query.patientId)) {
      filter.patientId = query.patientId;
    } else {
      const pat = await Patient.findOne({ patientId: String(query.patientId).trim().toUpperCase() });
      if (pat) {
        filter.patientId = pat._id;
      } else {
        throw ApiError.badRequest("Invalid patientId format");
      }
    }
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.date) {
    const [year, month, day] = query.date.split("-").map(Number);
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    filter.appointmentDate = { $gte: dayStart, $lte: dayEnd };
  } else if (query.startDate || query.endDate) {
    filter.appointmentDate = {};
    if (query.startDate) filter.appointmentDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.appointmentDate.$lte = new Date(query.endDate);
  }

  return paginate(Appointment, query, {
    baseFilter: filter,
    searchFields: ["purpose", "notes"],
    allowedSort: ["appointmentDate", "createdAt", "status"],
    populate: POPULATE_FIELDS,
  });
}

/**
 * 3. GET /:id - View appointment details.
 * Doctors may only view their own appointments using checkRole.
 */
async function getAppointmentById(id, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid appointment ID format");
  }

  const appointment = await Appointment.findById(id).populate(POPULATE_FIELDS);

  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");
  const isReceptionist = checkRole(userOrReq, "Receptionist");

  // Role check: Doctors can only view their own appointments
  if (isDoctor && !isSuperAdmin && !isReceptionist) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await getDoctorForUser(userId);
    const apptDoctorId = String(appointment.doctorId?._id || appointment.doctorId);

    if (apptDoctorId !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only view their own appointments");
    }
  }

  return appointment;
}

/**
 * 4. PATCH /:id - Update purpose/notes or reschedule appointment.
 * Doctors may update their own consultation notes/purpose.
 */
async function updateAppointment(id, payload, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid appointment ID format");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");
  const isReceptionist = checkRole(userOrReq, "Receptionist");

  // Role check: Doctors can only update their own appointments
  if (isDoctor && !isSuperAdmin && !isReceptionist) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await getDoctorForUser(userId);

    if (String(appointment.doctorId) !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only update their own appointments");
    }
  }

  // Handle rescheduling if slotId is provided
  if (payload.slotId && String(payload.slotId) !== String(appointment.slotId)) {
    if (appointment.status === "cancelled" || appointment.status === "completed") {
      throw ApiError.badRequest(`Cannot reschedule a ${appointment.status} appointment`);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.slotId)) {
      throw ApiError.badRequest("Invalid slotId format");
    }

    // Atomically reserve the new slot for future available slot
    const now = new Date();
    const newSlot = await Slot.findOneAndUpdate(
      { _id: payload.slotId, doctorId: appointment.doctorId, status: "available", startAt: { $gt: now } },
      { $set: { status: "booked" } },
      { new: true }
    );

    if (!newSlot) {
      const existingSlot = await Slot.findById(payload.slotId);
      if (!existingSlot) {
        throw ApiError.notFound("Slot not found");
      }
      if (String(existingSlot.doctorId) !== String(appointment.doctorId)) {
        throw ApiError.badRequest("Slot does not belong to the specified doctor");
      }
      if (new Date(existingSlot.startAt) <= now) {
        throw ApiError.badRequest("Cannot reschedule to a past time slot. Please select an upcoming consultation slot.");
      }
      throw ApiError.conflict("New slot is already booked or unavailable");
    }

    // Free the previous slot so anyone else can immediately book it
    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, { status: "available" });
    }

    appointment.slotId = newSlot._id;
    appointment.appointmentDate = newSlot.startAt;
  }

  if (payload.purpose !== undefined) {
    appointment.purpose = payload.purpose;
  }

  if (payload.notes !== undefined) {
    appointment.notes = payload.notes;
  }

  await appointment.save();

  await auditService.log({
    actor,
    action: "update_appointment",
    module: "appointments",
    entity: "Appointment",
    entityId: appointment._id,
    req,
  });

  const result = await getAppointmentById(appointment._id, actor, req);
  emitAppointmentEvent("appointment:updated", {
    appointment: result,
    appointmentId: result._id,
    doctorId: result.doctorId?._id || result.doctorId,
    status: result.status,
    changedFields: {
      ...(payload.slotId ? { slotId: result.slotId?._id || result.slotId, appointmentDate: result.appointmentDate } : {}),
      ...(payload.purpose !== undefined ? { purpose: result.purpose } : {}),
      ...(payload.notes !== undefined ? { notes: result.notes } : {}),
    },
  });
  return result;
}

/**
 * 5. DELETE /:id - Cancel an appointment and release its slot.
 */
async function cancelAppointment(id, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid appointment ID format");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");
  const isReceptionist = checkRole(userOrReq, "Receptionist");

  if (isDoctor && !isSuperAdmin && !isReceptionist) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await getDoctorForUser(userId);

    if (String(appointment.doctorId) !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only cancel their own appointments");
    }
  }

  if (appointment.status === "cancelled") {
    throw ApiError.badRequest("Appointment is already cancelled");
  }
  if (appointment.status === "completed") {
    throw ApiError.badRequest("Cannot cancel a completed appointment");
  }

  appointment.status = "cancelled";
  await appointment.save();

  // Release the slot back to available
  if (appointment.slotId) {
    await Slot.findByIdAndUpdate(appointment.slotId, { status: "available" });
  }

  await auditService.log({
    actor,
    action: "cancel_appointment",
    module: "appointments",
    entity: "Appointment",
    entityId: appointment._id,
    req,
  });

  const result = await getAppointmentById(appointment._id, actor, req);
  emitAppointmentEvent("appointment:cancelled", {
    appointment: result,
    appointmentId: result._id,
    doctorId: result.doctorId?._id || result.doctorId,
    status: "cancelled",
    changedFields: { status: "cancelled" },
  });
  return result;
}

/**
 * 6. POST /:id/arrive - Mark patient as arrived.
 */
async function markArrived(id, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid appointment ID format");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  if (appointment.status !== "scheduled") {
    throw ApiError.badRequest(`Cannot mark as arrived: appointment is currently ${appointment.status}`);
  }

  appointment.status = "arrived";
  await appointment.save();

  await auditService.log({
    actor,
    action: "mark_patient_arrived",
    module: "appointments",
    entity: "Appointment",
    entityId: appointment._id,
    req,
  });

  const result = await getAppointmentById(appointment._id, actor, req);
  emitAppointmentEvent("appointment:arrived", {
    appointment: result,
    appointmentId: result._id,
    doctorId: result.doctorId?._id || result.doctorId,
    status: "arrived",
    changedFields: { status: "arrived" },
  });
  return result;
}

/**
 * 7. POST /:id/complete - Mark appointment as completed (Doctor own appointment).
 */
async function markCompleted(id, payload = {}, actor, req) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid appointment ID format");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  const userOrReq = req || actor;
  const isDoctor = checkRole(userOrReq, "Doctor");
  const isSuperAdmin = checkRole(userOrReq, "Super Admin");

  // Role check: Doctor can only complete their own appointments
  if (isDoctor && !isSuperAdmin) {
    const userId = req?.user?._id || actor?._id;
    const ownDoctor = await getDoctorForUser(userId);

    if (String(appointment.doctorId) !== String(ownDoctor._id)) {
      throw ApiError.forbidden("Doctors can only complete their own appointments");
    }
  }

  if (appointment.status === "completed") {
    throw ApiError.badRequest("Appointment is already completed");
  }
  if (appointment.status === "cancelled") {
    throw ApiError.badRequest("Cannot complete a cancelled appointment");
  }

  if (payload.notes !== undefined) {
    appointment.notes = payload.notes;
  }

  appointment.status = "completed";
  await appointment.save();

  await auditService.log({
    actor,
    action: "complete_appointment",
    module: "appointments",
    entity: "Appointment",
    entityId: appointment._id,
    req,
  });

  const result = await getAppointmentById(appointment._id, actor, req);
  emitAppointmentEvent("appointment:completed", {
    appointment: result,
    appointmentId: result._id,
    doctorId: result.doctorId?._id || result.doctorId,
    status: "completed",
    changedFields: {
      status: "completed",
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
  });
  return result;
}

module.exports = {
  bookAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  markArrived,
  markCompleted,
};
