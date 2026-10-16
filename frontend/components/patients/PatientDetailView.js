"use client";

import React, { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { AppointmentStatusBadge } from "@/components/medical/AppointmentStatusBadge";
import { AppointmentSummary } from "@/components/medical/AppointmentSummary";
import { usePatient } from "@/hooks/queries/usePatientQuery";
import { useAppointments } from "@/hooks/queries/useAppointmentQuery";
import { useAuth } from "@/contexts/AuthProvider";
import { formatDate } from "@/lib/utils";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiClock,
  FiEdit,
  FiPlus,
  FiSearch,
  FiFileText,
  FiActivity,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiPrinter,
  FiEye,
} from "react-icons/fi";
import { FaUserMd, FaStethoscope } from "react-icons/fa";

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) {
    years--;
  }
  if (years <= 0) return "< 1 yr";
  return `${years} yrs`;
}

function getDoctorName(appt) {
  if (!appt) return "Assigned Doctor";
  const name =
    appt.doctorId?.userId?.name ||
    appt.doctorId?.name ||
    appt.doctor?.userId?.name ||
    appt.doctor?.user?.name ||
    appt.doctor?.name;
  if (!name) return "Assigned Doctor";
  const cleaned = name.replace(/^Dr\.\s*/i, "").trim();
  return `Dr. ${cleaned}`;
}

function getDoctorSpecialization(appt) {
  return (
    appt.doctorId?.specialization ||
    appt.doctor?.specialization ||
    "General Medicine"
  );
}

function getDepartmentName(appt) {
  return (
    appt.departmentId?.name ||
    appt.doctorId?.departmentId?.name ||
    appt.doctor?.department?.name ||
    appt.doctor?.departmentName ||
    "General OPD"
  );
}

function formatSlotTime(appt) {
  const startAt = appt.slotId?.startAt;
  const endAt = appt.slotId?.endAt;
  if (!startAt) return null;
  const start = new Date(startAt);
  const startTime = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  if (!endAt) return startTime;
  const end = new Date(endAt);
  const endTime = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${startTime} – ${endTime}`;
}

function formatFullDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function PatientDetailView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.PATIENTS_UPDATE);
  const canBook = can(PERMISSIONS.APPOINTMENTS_CREATE);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const { data: patData, isLoading, error, refetch } = usePatient(id);
  const patient = patData?.data?.patient || patData?.data || null;

  // Query appointments by patient MongoDB _id or string ID
  const patientQueryId = patient?._id || id;
  const {
    data: apptData,
    isLoading: loadingAppts,
    refetch: refetchAppts,
    isRefetching: refetchingAppts,
  } = useAppointments(
    { patientId: patientQueryId, limit: 100 },
    { enabled: Boolean(patientQueryId) }
  );

  const appointments = useMemo(() => {
    return (
      apptData?.data?.items ||
      apptData?.data?.appointments ||
      apptData?.data ||
      []
    );
  }, [apptData]);

  // Derived metrics
  const age = calculateAge(patient?.dateOfBirth);
  const isActive = patient?.status === "active" || patient?.isActive !== false;

  const scheduledCount = useMemo(
    () => appointments.filter((a) => a.status === "scheduled" || a.status === "booked").length,
    [appointments]
  );
  const arrivedCount = useMemo(
    () => appointments.filter((a) => a.status === "arrived").length,
    [appointments]
  );
  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments]
  );
  const cancelledCount = useMemo(
    () => appointments.filter((a) => a.status === "cancelled").length,
    [appointments]
  );

  // Latest consulting doctor
  const latestDoctor = useMemo(() => {
    if (appointments.length === 0) return null;
    return getDoctorName(appointments[0]);
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Tab filter
      if (activeTab === "scheduled" && appt.status !== "scheduled" && appt.status !== "booked") return false;
      if (activeTab === "arrived" && appt.status !== "arrived") return false;
      if (activeTab === "completed" && appt.status !== "completed") return false;
      if (activeTab === "cancelled" && appt.status !== "cancelled") return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const docName = getDoctorName(appt).toLowerCase();
        const spec = getDoctorSpecialization(appt).toLowerCase();
        const dept = getDepartmentName(appt).toLowerCase();
        const purpose = (appt.purpose || "").toLowerCase();
        const notes = (appt.notes || "").toLowerCase();
        return (
          docName.includes(query) ||
          spec.includes(query) ||
          dept.includes(query) ||
          purpose.includes(query) ||
          notes.includes(query)
        );
      }
      return true;
    });
  }, [appointments, activeTab, searchTerm]);

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.PATIENTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />

        {isLoading ? (
          <LoadingState message="Loading patient chart..." fullPage={false} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} title="Failed to load patient chart" />
        ) : patient ? (
          <div className="space-y-6">
            {/* Patient Header Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar name={patient.name} size="lg" className="h-16 w-16 text-lg shrink-0" />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-2xl font-bold text-text">
                        {patient.name}
                      </h1>
                      <Badge variant={isActive ? "success" : "secondary"} size="md">
                        {isActive ? "Active Patient" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" size="md" className="font-mono text-primary font-semibold">
                        ID: {patient.patientId || patient._id}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Registered on {formatDate(patient.createdAt, { dateOnly: true })}
                      {latestDoctor && (
                        <span className="ml-2 font-medium text-text">
                          • Recent Physician: <strong className="text-primary font-semibold">{latestDoctor}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push("/patients")}>
                    Back to List
                  </Button>

                  {canUpdate && (
                    <Link href={`/patients/${patient._id || id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-amber-500">
                        <FiEdit className="h-3.5 w-3.5" />
                        Edit Details
                      </Button>
                    </Link>
                  )}

                  {canBook && (
                    <Link href={`/appointments/new?patientId=${patient._id || id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5">
                        <FiPlus className="h-3.5 w-3.5" />
                        Book Appointment
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Demographics Details Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 border-t border-border/80 pt-5 text-xs">
                <div>
                  <span className="text-muted block">Mobile Contact</span>
                  <p className="text-sm font-semibold text-text mt-0.5 flex items-center gap-1.5">
                    <FiPhone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{patient.mobile || "N/A"}</span>
                  </p>
                </div>
                <div>
                  <span className="text-muted block">Gender</span>
                  <p className="text-sm font-semibold text-text mt-0.5 capitalize flex items-center gap-1.5">
                    <FiUser className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{patient.gender || "N/A"}</span>
                  </p>
                </div>
                <div>
                  <span className="text-muted block">Age / Date of Birth</span>
                  <p className="text-sm font-semibold text-text mt-0.5 flex items-center gap-1.5">
                    <FiCalendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      {age ? `${age} ` : ""}
                      {patient.dateOfBirth ? `(${formatDate(patient.dateOfBirth, { dateOnly: true })})` : "N/A"}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-muted block">Blood Group</span>
                  <p className="text-sm font-semibold text-text mt-0.5">
                    {patient.bloodGroup || "Not recorded"}
                  </p>
                </div>
                <div>
                  <span className="text-muted block">Consulting Physician</span>
                  <p className="text-sm font-semibold text-primary mt-0.5 truncate flex items-center gap-1">
                    <FaUserMd className="h-3.5 w-3.5 shrink-0" />
                    <span>{latestDoctor || "Not assigned yet"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Total Consultations</span>
                  <FaStethoscope className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-text mt-1">{appointments.length}</p>
                <p className="text-[11px] text-muted mt-0.5">Recorded patient visits</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Upcoming / Scheduled</span>
                  <FiClock className="h-4 w-4 text-sky-500" />
                </div>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                  {scheduledCount}
                </p>
                <p className="text-[11px] text-muted mt-0.5">Pending consultations</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Completed Visits</span>
                  <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {completedCount}
                </p>
                <p className="text-[11px] text-muted mt-0.5">Fulfilled appointments</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Cancelled</span>
                  <FiAlertCircle className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {cancelledCount}
                </p>
                <p className="text-[11px] text-muted mt-0.5">Cancelled or revoked</p>
              </div>
            </div>

            {/* Complete Consultation & Medical History */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
              {/* History Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
                    <FaUserMd className="h-5 w-5 text-primary" />
                    Doctor Consultations & Medical History
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Complete chronological history of physician consultations, diagnoses, and notes for this patient.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchAppts()}
                    disabled={refetchingAppts}
                    className="text-xs text-muted hover:text-text gap-1"
                    title="Refresh history"
                  >
                    <FiRefreshCw className={`h-3.5 w-3.5 ${refetchingAppts ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>

                  {canBook && (
                    <Link href={`/appointments/new?patientId=${patient._id || id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                        <FiPlus className="h-3.5 w-3.5" />
                        New Appointment
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Filter Tabs and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "all"
                        ? "bg-primary text-white"
                        : "bg-surface-elevated text-muted hover:text-text border border-border"
                    }`}
                  >
                    All History ({appointments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("scheduled")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "scheduled"
                        ? "bg-primary text-white"
                        : "bg-surface-elevated text-muted hover:text-text border border-border"
                    }`}
                  >
                    Scheduled ({scheduledCount})
                  </button>
                  {arrivedCount > 0 && (
                    <button
                      onClick={() => setActiveTab("arrived")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === "arrived"
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-muted hover:text-text border border-border"
                      }`}
                    >
                      Arrived ({arrivedCount})
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "completed"
                        ? "bg-primary text-white"
                        : "bg-surface-elevated text-muted hover:text-text border border-border"
                    }`}
                  >
                    Completed ({completedCount})
                  </button>
                  {cancelledCount > 0 && (
                    <button
                      onClick={() => setActiveTab("cancelled")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === "cancelled"
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-muted hover:text-text border border-border"
                      }`}
                    >
                      Cancelled ({cancelledCount})
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-72">
                  <SearchInput
                    placeholder="Search doctor, purpose, notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm("")}
                    size="sm"
                  />
                </div>
              </div>

              {/* History Content */}
              {loadingAppts ? (
                <div className="p-12 text-center text-xs text-muted">
                  <FiRefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                  Loading patient medical and consultation records...
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-12 text-center rounded-xl border border-dashed border-border bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                  <FaUserMd className="h-10 w-10 text-muted mx-auto" />
                  <div>
                    <h3 className="font-display font-semibold text-text text-sm">
                      No Medical Consultations Found
                    </h3>
                    <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                      This patient has not been scheduled for any doctor visits or consultations yet.
                    </p>
                  </div>
                  {canBook && (
                    <Link href={`/appointments/new?patientId=${patient._id || id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5 mt-2">
                        <FiPlus className="h-3.5 w-3.5" />
                        Book First Consultation
                      </Button>
                    </Link>
                  )}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border text-xs text-muted space-y-2">
                  <p>No consultations found matching your search &ldquo;{searchTerm}&rdquo; or current tab filter.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setActiveTab("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appt) => {
                    const apptId = appt.id || appt._id;
                    const docName = getDoctorName(appt);
                    const specialization = getDoctorSpecialization(appt);
                    const department = getDepartmentName(appt);
                    const slotTime = formatSlotTime(appt);
                    const apptDateStr = formatFullDate(appt.appointmentDate || appt.slotId?.startAt || appt.createdAt);

                    return (
                      <div
                        key={apptId}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all space-y-4"
                      >
                        {/* Consultation Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FaUserMd className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display font-bold text-base text-text">
                                  {docName}
                                </h3>
                                <AppointmentStatusBadge status={appt.status} size="sm" />
                              </div>
                              <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                                <span className="font-medium text-text">{specialization}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <FiLayers className="h-3 w-3 text-primary" />
                                  {department}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <Link href={`/appointments/${apptId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5"
                              >
                                <FiEye className="h-3.5 w-3.5 text-primary" />
                                View Details
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5"
                              onClick={() => setSelectedAppointment(appt)}
                            >
                              <FiPrinter className="h-3.5 w-3.5" />
                              View Slip
                            </Button>
                          </div>
                        </div>

                        {/* Timing and Purpose Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          {/* Schedule block */}
                          <div className="rounded-lg border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
                            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                              Schedule Date & Time
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-text">
                              <FiCalendar className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{apptDateStr}</span>
                            </div>
                            {slotTime && (
                              <div className="flex items-center gap-1.5 text-primary font-bold">
                                <FiClock className="h-3.5 w-3.5 shrink-0" />
                                <span>{slotTime}</span>
                              </div>
                            )}
                          </div>

                          {/* Chief Complaint / Purpose */}
                          <div className="rounded-lg border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
                            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                              Reason for Visit / Purpose
                            </span>
                            <p className="font-semibold text-text flex items-center gap-1.5">
                              <FiActivity className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>{appt.purpose || "General Health Consultation"}</span>
                            </p>
                          </div>

                          {/* Administrative metadata */}
                          <div className="rounded-lg border border-border/70 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1 sm:col-span-2 lg:col-span-1">
                            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                              Booking Record
                            </span>
                            <p className="text-muted">
                              Booked by: <span className="font-semibold text-text">{appt.bookedBy?.name || "Staff"}</span>
                            </p>
                            <p className="text-[11px] text-muted">
                              Created on: {formatDate(appt.createdAt, { dateOnly: true })}
                            </p>
                          </div>
                        </div>

                        {/* Clinical / Doctor Notes */}
                        <div className="rounded-lg border border-border/80 bg-surface-elevated/40 p-3.5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                            <FiFileText className="h-3.5 w-3.5 text-primary" />
                            <span>Physician Clinical Notes & Recommendations:</span>
                          </div>
                          {appt.notes ? (
                            <p className="text-xs text-text bg-surface p-2.5 rounded border border-border/60 whitespace-pre-wrap leading-relaxed">
                              {appt.notes}
                            </p>
                          ) : (
                            <p className="text-xs text-muted italic">
                              No clinical consultation notes documented yet. Notes are recorded upon consultation completion.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appointment Detail Modal / Slip */}
            {selectedAppointment && (
              <Modal
                open={Boolean(selectedAppointment)}
                onClose={() => setSelectedAppointment(null)}
                title="Appointment Slip & Medical Summary"
                size="lg"
              >
                <div className="space-y-4">
                  <AppointmentSummary
                    patient={patient}
                    doctor={{
                      name: getDoctorName(selectedAppointment),
                      specialization: getDoctorSpecialization(selectedAppointment),
                      departmentName: getDepartmentName(selectedAppointment),
                    }}
                    slot={
                      selectedAppointment.slotId || {
                        startAt: selectedAppointment.appointmentDate,
                      }
                    }
                    department={{ name: getDepartmentName(selectedAppointment) }}
                    status={selectedAppointment.status}
                    onCancel={() => setSelectedAppointment(null)}
                  />

                  {selectedAppointment.purpose && (
                    <div className="rounded-lg border border-border p-3 text-xs">
                      <span className="font-bold text-text block mb-1">Reason for Visit:</span>
                      <p className="text-muted">{selectedAppointment.purpose}</p>
                    </div>
                  )}

                  {selectedAppointment.notes && (
                    <div className="rounded-lg border border-border p-3 text-xs">
                      <span className="font-bold text-text block mb-1">Doctor Consultation Notes:</span>
                      <p className="text-muted whitespace-pre-wrap">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </Modal>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-muted">Patient chart not found.</div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
