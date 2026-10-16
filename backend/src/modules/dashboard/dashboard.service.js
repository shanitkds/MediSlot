const mongoose = require("mongoose");
const Appointment = require("../../models/Appointment");
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const User = require("../../models/User");
const Role = require("../../models/Role");
const Department = require("../../models/Department");
const Slot = require("../../models/Slot");
const ApiError = require("../../utils/ApiError");
const checkRole = require("../../utils/checkRole");

const POPULATE_APPOINTMENT = [
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
 * Returns start and end of day Date objects for given date string or current time.
 */
function getDayBounds(dateString) {
  let date;
  if (dateString) {
    // If YYYY-MM-DD
    const parts = dateString.split("-");
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(dateString);
    }
  } else {
    date = new Date();
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Normalizes an appointment document into a standardized object with flat patient, doctor, and department details.
 */
function formatAppointment(appt) {
  const doc = appt.toObject ? appt.toObject() : appt;

  const patientName = doc.patientId?.name || "Unknown Patient";
  const patientMobile = doc.patientId?.mobile || "";
  const patientCode = doc.patientId?.patientId || "";

  const doctorName = doc.doctorId?.userId?.name || "Dr. Unassigned";
  const doctorSpecialization = doc.doctorId?.specialization || "";

  const departmentName = doc.departmentId?.name || doc.doctorId?.departmentId?.name || "General";

  return {
    _id: doc._id,
    appointmentDate: doc.appointmentDate,
    slot: doc.slotId
      ? {
          _id: doc.slotId._id,
          startAt: doc.slotId.startAt,
          endAt: doc.slotId.endAt,
          status: doc.slotId.status,
        }
      : null,
    patient: {
      _id: doc.patientId?._id || null,
      patientId: patientCode,
      name: patientName,
      mobile: patientMobile,
      gender: doc.patientId?.gender || "",
      dateOfBirth: doc.patientId?.dateOfBirth || null,
    },
    doctor: {
      _id: doc.doctorId?._id || null,
      name: doctorName,
      specialization: doctorSpecialization,
      consultationDuration: doc.doctorId?.consultationDuration || 15,
    },
    department: {
      _id: doc.departmentId?._id || doc.doctorId?.departmentId?._id || null,
      name: departmentName,
    },
    purpose: doc.purpose || "",
    notes: doc.notes || "",
    status: doc.status,
    bookedBy: doc.bookedBy
      ? {
          _id: doc.bookedBy._id,
          name: doc.bookedBy.name,
          email: doc.bookedBy.email,
        }
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Task 1, 2, 3, 4: Role-Based Dashboard Summary & Counts
 * GET /api/v1/dashboard/summary
 *
 * Checks user role inside the service:
 * - Super Admin:
 *   - totalDoctors
 *   - totalReceptionists
 *   - totalPatients
 *   - totalAppointments
 *   - todayAppointments
 *   - appointmentCountsByStatus (scheduled, arrived, completed, cancelled)
 *
 * - Receptionist:
 *   - totalPatients
 *   - todayAppointments
 *   - pendingAppointments (scheduled)
 *   - arrivedPatients (arrived)
 *   - completedAppointments (completed)
 *   - appointmentCountsByStatus (scheduled, arrived, completed, cancelled)
 *
 * - Doctor:
 *   - totalAppointments (doctor's own appointments)
 *   - todayAppointments
 *   - upcomingAppointments
 *   - patientsWaiting (arrived today)
 *   - completedConsultations
 *   - appointmentCountsByStatus (for this doctor: scheduled, arrived, completed, cancelled)
 */
async function getSummary(actor, query = {}) {
  const isSuperAdmin = checkRole(actor, "Super Admin", "Admin");
  const isDoctor = checkRole(actor, "Doctor");
  const isReceptionist = checkRole(actor, "Receptionist");

  const { start: startOfToday, end: endOfToday } = getDayBounds(query.date);
  const now = new Date();

  // 1. DOCTOR ROLE (Scoped to logged-in doctor, or Super Admin inspecting doctor via doctorId)
  if ((isDoctor && !isSuperAdmin) || (isSuperAdmin && query.doctorId)) {
    let doctor;
    if (query.doctorId) {
      doctor = await Doctor.findById(query.doctorId);
      if (!doctor) {
        throw ApiError.notFound("Doctor profile not found");
      }
    } else {
      doctor = await Doctor.findOne({ userId: actor._id });
      if (!doctor) {
        throw ApiError.notFound("Doctor profile not found for authenticated user");
      }
    }

    const doctorFilter = { doctorId: doctor._id };

    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      patientsWaiting,
      completedConsultations,
      scheduledCount,
      arrivedCount,
      completedCount,
      cancelledCount,
    ] = await Promise.all([
      Appointment.countDocuments(doctorFilter),
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: startOfToday, $lte: endOfToday },
      }),
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: now },
        status: { $ne: "cancelled" },
      }),
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: startOfToday, $lte: endOfToday },
        status: "arrived",
      }),
      Appointment.countDocuments({
        ...doctorFilter,
        status: "completed",
      }),
      Appointment.countDocuments({ ...doctorFilter, status: "scheduled" }),
      Appointment.countDocuments({ ...doctorFilter, status: "arrived" }),
      Appointment.countDocuments({ ...doctorFilter, status: "completed" }),
      Appointment.countDocuments({ ...doctorFilter, status: "cancelled" }),
    ]);

    return {
      role: "Doctor",
      doctorId: doctor._id,
      summary: {
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        patientsWaiting,
        completedConsultations,
      },
      appointmentCountsByStatus: {
        scheduled: scheduledCount,
        arrived: arrivedCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    };
  }

  // 2. RECEPTIONIST ROLE (Front-desk clinic operations)
  if ((isReceptionist && !isSuperAdmin) || (isSuperAdmin && (query.role === "receptionist" || query.role === "Receptionist"))) {
    const todayFilter = {
      appointmentDate: { $gte: startOfToday, $lte: endOfToday },
    };

    const [
      totalPatients,
      todayAppointments,
      pendingAppointments,
      arrivedPatients,
      completedAppointments,
      scheduledCount,
      arrivedCount,
      completedCount,
      cancelledCount,
    ] = await Promise.all([
      Patient.countDocuments({}),
      Appointment.countDocuments(todayFilter),
      Appointment.countDocuments({ ...todayFilter, status: "scheduled" }),
      Appointment.countDocuments({ ...todayFilter, status: "arrived" }),
      Appointment.countDocuments({ ...todayFilter, status: "completed" }),
      Appointment.countDocuments({ status: "scheduled" }),
      Appointment.countDocuments({ status: "arrived" }),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "cancelled" }),
    ]);

    return {
      role: "Receptionist",
      summary: {
        totalPatients,
        todayAppointments,
        pendingAppointments,
        arrivedPatients,
        completedAppointments,
      },
      appointmentCountsByStatus: {
        scheduled: scheduledCount,
        arrived: arrivedCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    };
  }

  // 3. SUPER ADMIN / ADMIN ROLE (Hospital-wide metrics)
  const receptionistRole = await Role.findOne({ slug: "receptionist", deletedAt: null });
  const receptionistFilter = receptionistRole
    ? { roleIds: receptionistRole._id, isArchive: false }
    : { isArchive: false };

  const [
    totalDoctors,
    totalReceptionists,
    totalPatients,
    totalAppointments,
    todayAppointments,
    scheduledCount,
    arrivedCount,
    completedCount,
    cancelledCount,
  ] = await Promise.all([
    Doctor.countDocuments({}),
    User.countDocuments(receptionistFilter),
    Patient.countDocuments({}),
    Appointment.countDocuments({}),
    Appointment.countDocuments({
      appointmentDate: { $gte: startOfToday, $lte: endOfToday },
    }),
    Appointment.countDocuments({ status: "scheduled" }),
    Appointment.countDocuments({ status: "arrived" }),
    Appointment.countDocuments({ status: "completed" }),
    Appointment.countDocuments({ status: "cancelled" }),
  ]);

  return {
    role: "Super Admin",
    summary: {
      totalDoctors,
      totalReceptionists,
      totalPatients,
      totalAppointments,
      todayAppointments,
    },
    appointmentCountsByStatus: {
      scheduled: scheduledCount,
      arrived: arrivedCount,
      completed: completedCount,
      cancelled: cancelledCount,
    },
  };
}

/**
 * Task 5: Today's Appointment Summary
 * GET /api/v1/dashboard/appointments/today
 *
 * Shows today's appointments, optionally grouped by time or status, based on logged-in user's role.
 */
async function getTodayAppointments(actor, query = {}) {
  const isSuperAdmin = checkRole(actor, "Super Admin", "Admin");
  const isDoctor = checkRole(actor, "Doctor");

  const { start: startOfDay, end: endOfDay } = getDayBounds(query.date);

  const filter = {
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
  };

  // Enforce role-based access inside service
  if (isDoctor && !isSuperAdmin) {
    const doctor = await Doctor.findOne({ userId: actor._id });
    if (!doctor) {
      throw ApiError.notFound("Doctor profile not found for authenticated user");
    }
    filter.doctorId = doctor._id;
  } else if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.departmentId) {
    filter.departmentId = query.departmentId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  const appointments = await Appointment.find(filter)
    .populate(POPULATE_APPOINTMENT)
    .sort({ appointmentDate: 1, createdAt: 1 });

  const formatted = appointments.map(formatAppointment);

  // Grouping logic
  const countsByStatus = {
    scheduled: 0,
    arrived: 0,
    completed: 0,
    cancelled: 0,
  };

  const groupedByStatus = {
    scheduled: [],
    arrived: [],
    completed: [],
    cancelled: [],
  };

  const groupedByTime = {};

  for (const item of formatted) {
    if (countsByStatus[item.status] !== undefined) {
      countsByStatus[item.status]++;
    }
    if (groupedByStatus[item.status]) {
      groupedByStatus[item.status].push(item);
    }

    // Format time label (e.g., slot start time or appointment hour)
    let timeKey = "Unscheduled Time";
    if (item.slot?.startAt) {
      const startTime = new Date(item.slot.startAt);
      const hours = String(startTime.getUTCHours()).padStart(2, "0");
      const minutes = String(startTime.getUTCMinutes()).padStart(2, "0");
      timeKey = `${hours}:${minutes}`;
    } else if (item.appointmentDate) {
      const apptTime = new Date(item.appointmentDate);
      const hours = String(apptTime.getUTCHours()).padStart(2, "0");
      const minutes = String(apptTime.getUTCMinutes()).padStart(2, "0");
      timeKey = `${hours}:${minutes}`;
    }

    if (!groupedByTime[timeKey]) {
      groupedByTime[timeKey] = [];
    }
    groupedByTime[timeKey].push(item);
  }

  let groupedResult = null;
  if (query.groupBy === "status") {
    groupedResult = groupedByStatus;
  } else if (query.groupBy === "time") {
    groupedResult = groupedByTime;
  }

  return {
    date: startOfDay.toISOString().split("T")[0],
    total: formatted.length,
    countsByStatus,
    appointments: formatted,
    ...(groupedResult ? { grouped: groupedResult } : {}),
  };
}

/**
 * Task 6: Upcoming Appointments List
 * GET /api/v1/dashboard/appointments/upcoming
 *
 * Displays upcoming appointments with:
 * - Appointment date and time
 * - Patient name and mobile
 * - Doctor name
 * - Department
 * - Appointment status
 */
async function getUpcomingAppointments(actor, query = {}) {
  const isSuperAdmin = checkRole(actor, "Super Admin", "Admin");
  const isDoctor = checkRole(actor, "Doctor");

  const now = new Date();
  const filter = {
    appointmentDate: { $gte: now },
  };

  // Enforce role-based access inside service
  if (isDoctor && !isSuperAdmin) {
    const doctor = await Doctor.findOne({ userId: actor._id });
    if (!doctor) {
      throw ApiError.notFound("Doctor profile not found for authenticated user");
    }
    filter.doctorId = doctor._id;
  } else if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.departmentId) {
    filter.departmentId = query.departmentId;
  }

  if (query.status) {
    filter.status = query.status;
  } else if (!query.includeCancelled) {
    filter.status = { $ne: "cancelled" };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [total, rawAppointments] = await Promise.all([
    Appointment.countDocuments(filter),
    Appointment.find(filter)
      .populate(POPULATE_APPOINTMENT)
      .sort({ appointmentDate: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit),
  ]);

  const items = rawAppointments.map(formatAppointment);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

module.exports = {
  getSummary,
  getTodayAppointments,
  getUpcomingAppointments,
  formatAppointment,
};
