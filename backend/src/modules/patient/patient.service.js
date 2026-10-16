const mongoose = require("mongoose");
const Patient = require("../../models/Patient");
const Appointment = require("../../models/Appointment");
const Slot = require("../../models/Slot");
const ApiError = require("../../utils/ApiError");
const { paginate } = require("../../utils/pagination");
const auditService = require("../audit/audit.service");

/**
 * Generate a unique patient ID (e.g. PT00001) if not provided.
 */
async function generateUniquePatientId() {
  let isUnique = false;
  let candidate = "";

  while (!isUnique) {
    const count = await Patient.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `PT${String(count + 1).padStart(3, "0")}${randomSuffix}`;
    const exists = await Patient.exists({ patientId: candidate });
    if (!exists) {
      isUnique = true;
    }
  }

  return candidate;
}

/**
 * Helper to resolve patient by ObjectId or patientId string.
 */
async function findPatientById(id) {
  let patient = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    patient = await Patient.findById(id);
  }

  if (!patient && typeof id === "string") {
    patient = await Patient.findOne({ patientId: id.trim().toUpperCase() });
  }

  if (!patient) {
    throw ApiError.notFound("Patient not found");
  }

  return patient;
}

/**
 * Register a new patient.
 */
async function create(payload, actor, req) {
  let patientId = payload.patientId ? payload.patientId.trim().toUpperCase() : null;

  if (patientId) {
    const existing = await Patient.findOne({ patientId });
    if (existing) {
      throw ApiError.conflict("Patient with this ID already exists");
    }
  } else {
    patientId = await generateUniquePatientId();
  }

  const patient = await Patient.create({
    patientId,
    name: payload.name.trim(),
    mobile: payload.mobile.trim(),
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender.toLowerCase(),
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    status: payload.status || "active",
  });

  await auditService.log({
    actor,
    action: "create",
    module: "patients",
    entity: "Patient",
    entityId: patient._id,
    req,
  });

  return patient;
}

/**
 * List patients supporting search, filtering, and pagination via common paginate helper.
 */
async function list(query = {}) {
  return paginate(Patient, query, {
    searchFields: ["name", "mobile", "patientId"],
    regexFields: ["name", "mobile", "patientId"],
    exactFields: ["status"],
    booleanFields: ["isActive"],
    allowedSort: ["createdAt", "name", "patientId", "mobile", "dateOfBirth", "isActive", "status"],
  });
}

/**
 * View patient details by ID or patientId.
 */
async function getById(id) {
  return findPatientById(id);
}

/**
 * Update patient details.
 */
async function update(id, payload, actor, req) {
  const patient = await findPatientById(id);

  if (payload.patientId) {
    const trimmedPatientId = payload.patientId.trim().toUpperCase();
    if (trimmedPatientId !== patient.patientId) {
      const existing = await Patient.findOne({
        _id: { $ne: patient._id },
        patientId: trimmedPatientId,
      });
      if (existing) {
        throw ApiError.conflict("Patient with this ID already exists");
      }
      patient.patientId = trimmedPatientId;
    }
  }

  if (payload.name !== undefined) {
    patient.name = payload.name.trim();
  }

  if (payload.mobile !== undefined) {
    patient.mobile = payload.mobile.trim();
  }

  if (payload.dateOfBirth !== undefined) {
    patient.dateOfBirth = payload.dateOfBirth;
  }

  if (payload.gender !== undefined) {
    patient.gender = payload.gender.toLowerCase();
  }

  if (payload.isActive !== undefined) {
    patient.isActive = payload.isActive;
    if (!patient.isActive) {
      patient.status = "inactive";
    } else if (payload.status === undefined) {
      patient.status = "active";
    }
  }

  if (payload.status !== undefined) {
    patient.status = payload.status;
    patient.isActive = payload.status === "active";
  }

  await patient.save();

  await auditService.log({
    actor,
    action: "update",
    module: "patients",
    entity: "Patient",
    entityId: patient._id,
    req,
  });

  return patient;
}

/**
 * Deactivate patient record.
 * - Sets isActive = false and status = "inactive".
 * - Historical appointment records are strictly preserved (no deletion).
 * - Cancels future scheduled appointments.
 * - Prevents deactivated patients from being used for new bookings.
 */
async function deactivate(id, actor, req) {
  const patient = await findPatientById(id);

  patient.isActive = false;
  patient.status = "inactive";
  await patient.save();

  // Cancel any upcoming scheduled appointments while strictly preserving all historical records,
  // and release their slots back to available for others to book
  const upcomingAppointments = await Appointment.find({ patientId: patient._id, status: "scheduled" });
  for (const appt of upcomingAppointments) {
    if (appt.slotId) {
      await Slot.findByIdAndUpdate(appt.slotId, { status: "available" });
    }
  }

  await Appointment.updateMany(
    { patientId: patient._id, status: "scheduled" },
    { $set: { status: "cancelled", notes: "Cancelled due to patient deactivation" } }
  );

  await auditService.log({
    actor,
    action: "deactivate",
    module: "patients",
    entity: "Patient",
    entityId: patient._id,
    req,
  });

  return patient;
}

module.exports = {
  create,
  list,
  getById,
  update,
  deactivate,
  findPatientById,
  generateUniquePatientId,
};
