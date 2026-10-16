"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useMarkAppointmentArrived,
  useMarkAppointmentCompleted,
} from "@/hooks/queries/useAppointmentQuery";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { normalizeRole } from "@/constants/routes";
import { formatDate } from "@/lib/utils";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUserCheck,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiSave,
  FiArrowLeft,
  FiPhone,
  FiMapPin,
  FiAlertCircle,
  FiActivity,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";

function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function formatTimeRange(startAt, endAt) {
  if (!startAt) return "—";
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  const startStr = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  if (!end) return startStr;

  const endStr = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return `${startStr} – ${endStr}`;
}

export function AppointmentDetailView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();
  const { user, can } = useAuth();
  const userRole = normalizeRole(user);

  const isDoctor = userRole === "doctor";
  const isReceptionist = userRole === "receptionist";
  const isSuperAdmin = userRole === "super_admin" || Boolean(user?.isSuperAdmin);

  const canUpdate = can(PERMISSIONS.APPOINTMENTS_UPDATE) || isDoctor || isReceptionist || isSuperAdmin;
  const canCancel = can(PERMISSIONS.APPOINTMENTS_DELETE) || isReceptionist || isSuperAdmin || isDoctor;

  // Fetch Appointment Details
  const {
    data: appointmentResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAppointment(id);

  const appointment =
    appointmentResponse?.data?.appointment ||
    appointmentResponse?.data ||
    null;

  // Local state for doctor's consultation notes
  const [notes, setNotes] = useState("");
  const [isNotesDirty, setIsNotesDirty] = useState(false);

  // Modals
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  // Sync loaded notes into local state
  useEffect(() => {
    if (appointment?.notes !== undefined) {
      setNotes(appointment.notes || "");
      setIsNotesDirty(false);
    }
  }, [appointment?.notes]);

  // Mutations
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const arriveMutation = useMarkAppointmentArrived();
  const completeMutation = useMarkAppointmentCompleted();

  // Save consultation notes
  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        notes: notes.trim(),
      });
      setIsNotesDirty(false);
      toast.success("Consultation notes saved successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to save consultation notes");
    }
  };

  // Mark patient as arrived
  const handleMarkArrived = async () => {
    if (!id) return;
    try {
      await arriveMutation.mutateAsync(id);
      toast.success("Patient marked as arrived at the clinic!");
    } catch (err) {
      toast.error(err?.message || "Failed to mark patient as arrived");
    }
  };

  // Cancel appointment
  const handleConfirmCancel = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Appointment cancelled and slot released successfully.");
      setShowCancelDialog(false);
    } catch (err) {
      toast.error(err?.message || "Failed to cancel appointment");
    }
  };

  // Complete consultation
  const handleConfirmComplete = async () => {
    if (!id) return;
    try {
      await completeMutation.mutateAsync({
        id,
        notes: completionNotes,
      });
      toast.success("Appointment marked as completed!");
      setShowCompleteModal(false);
    } catch (err) {
      toast.error(err?.message || "Failed to complete appointment");
    }
  };

  const patient = appointment?.patientId || {};
  const patientId = patient._id || patient.id;
  const patientAge = calculateAge(patient.dateOfBirth);
  const doctor = appointment?.doctorId || {};
  const doctorUser = doctor.userId || {};
  const doctorName = doctorUser.name ? `Dr. ${doctorUser.name}` : "Assigned Doctor";
  const departmentName =
    appointment?.departmentId?.name ||
    doctor.departmentId?.name ||
    "General Medicine";

  const slot = appointment?.slotId || {};
  const appointmentDate = appointment?.appointmentDate || slot.startAt;
  const timeSlotStr = formatTimeRange(slot.startAt, slot.endAt);
  const currentStatus = appointment?.status || "scheduled";

  // Stepper helper
  const isCancelled = currentStatus === "cancelled";
  const isCompleted = currentStatus === "completed";
  const isArrived = currentStatus === "arrived" || isCompleted;

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.APPOINTMENTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />

        {isLoading ? (
          <LoadingState message="Loading appointment details..." fullPage={false} />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={refetch}
            title="Failed to load appointment details"
          />
        ) : appointment ? (
          <div className="space-y-6">
            {/* Top Navigation & Status Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar name={patient.name || "Patient"} size="lg" className="h-16 w-16 text-lg shrink-0" />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-2xl font-bold text-text">
                        {patient.name || "Patient Appointment"}
                      </h1>
                      <StatusBadge status={currentStatus} size="lg" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-text-muted">
                      <span className="font-mono text-primary font-semibold">
                        Appt ID: {appointment._id || id}
                      </span>
                      <span>•</span>
                      <span>
                        Patient MRN:{" "}
                        <strong className="text-text font-medium">
                          {patient.patientId || patientId || "—"}
                        </strong>
                      </span>
                      {appointment.createdAt && (
                        <>
                          <span>•</span>
                          <span>Booked on {formatDate(appointment.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/appointments")}
                    className="gap-1.5"
                  >
                    <FiArrowLeft className="h-4 w-4" />
                    <span>Back to List</span>
                  </Button>

                  {/* Receptionist / Admin: Mark as Arrived */}
                  {(isReceptionist || isSuperAdmin) && currentStatus === "scheduled" && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={arriveMutation.isPending}
                      onClick={handleMarkArrived}
                    >
                      <FiUserCheck className="h-4 w-4" />
                      <span>Mark as Arrived</span>
                    </Button>
                  )}

                  {/* Cancel Appointment - Available before complete status is set */}
                  {canCancel && (currentStatus === "scheduled" || currentStatus === "arrived") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <FiXCircle className="h-4 w-4" />
                      <span>Cancel Appointment</span>
                    </Button>
                  )}

                  {/* Doctor / Admin: Complete Appointment */}
                  {(isDoctor || isSuperAdmin) && (currentStatus === "scheduled" || currentStatus === "arrived") && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setCompletionNotes(notes || appointment.notes || "");
                        setShowCompleteModal(true);
                      }}
                    >
                      <FiCheckCircle className="h-4 w-4" />
                      <span>Complete Consultation</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Clinical Progress Stepper */}
              <div className="mt-6 pt-5 border-t border-border/70">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Step 1: Booked */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/80 bg-surface-secondary/50">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <FiCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text">1. Appointment Booked</div>
                      <div className="text-[11px] text-text-muted">Slot reserved successfully</div>
                    </div>
                  </div>

                  {/* Step 2: Arrived */}
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isCancelled
                        ? "opacity-40 border-border bg-surface-secondary/30"
                        : isArrived
                        ? "border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20"
                        : "border-border/80 bg-surface-secondary/30"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isArrived
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-text-muted"
                      }`}
                    >
                      {isArrived ? <FiCheck className="h-4 w-4" /> : "2"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text">2. Patient Arrival</div>
                      <div className="text-[11px] text-text-muted">
                        {isArrived ? "Patient arrived in clinic" : "Pending arrival check-in"}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Completed or Cancelled */}
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isCancelled
                        ? "border-rose-500/40 bg-rose-50/60 dark:bg-rose-950/20"
                        : isCompleted
                        ? "border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20"
                        : "border-border/80 bg-surface-secondary/30"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCancelled
                          ? "bg-rose-600 text-white"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-text-muted"
                      }`}
                    >
                      {isCancelled ? <FiXCircle className="h-4 w-4" /> : isCompleted ? <FiCheck className="h-4 w-4" /> : "3"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text">
                        {isCancelled ? "3. Appointment Cancelled" : "3. Consultation Complete"}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {isCancelled
                          ? "Slot released to clinic"
                          : isCompleted
                          ? "Consultation finished"
                          : "Awaiting doctor sign-off"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 cols): Clinical & Schedule Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Appointment Schedule & Visit Info */}
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h2 className="font-semibold text-base text-text flex items-center gap-2">
                      <FiCalendar className="h-4 w-4 text-primary" />
                      Appointment & Schedule Information
                    </h2>
                    <span className="text-xs font-mono text-text-muted">
                      {formatDate(appointmentDate, { dateOnly: true })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/40 space-y-1">
                      <div className="text-xs text-text-muted flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5 text-primary" />
                        <span>Appointment Date</span>
                      </div>
                      <div className="font-semibold text-sm text-text">
                        {formatDate(appointmentDate, { dateOnly: true })}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/40 space-y-1">
                      <div className="text-xs text-text-muted flex items-center gap-1.5">
                        <FiClock className="h-3.5 w-3.5 text-primary" />
                        <span>Scheduled Time Slot</span>
                      </div>
                      <div className="font-semibold text-sm text-text font-mono">
                        {timeSlotStr}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/40 space-y-1">
                      <div className="text-xs text-text-muted flex items-center gap-1.5">
                        <FaUserMd className="h-3.5 w-3.5 text-primary" />
                        <span>Assigned Doctor</span>
                      </div>
                      <div className="font-semibold text-sm text-text">
                        {doctorName}
                      </div>
                      <div className="text-xs text-text-muted">
                        {doctor.specialization || "General Practice"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/40 space-y-1">
                      <div className="text-xs text-text-muted flex items-center gap-1.5">
                        <FiActivity className="h-3.5 w-3.5 text-primary" />
                        <span>Medical Department</span>
                      </div>
                      <div className="font-semibold text-sm text-text">
                        {departmentName}
                      </div>
                    </div>
                  </div>

                  {/* Visit Purpose */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-text uppercase tracking-wider">
                      Purpose of Consultation / Symptoms
                    </label>
                    <div className="p-3.5 rounded-lg border border-border bg-surface-secondary/30 text-sm text-text leading-relaxed">
                      {appointment.purpose || (
                        <span className="italic text-text-muted">No specific purpose stated</span>
                      )}
                    </div>
                  </div>

                  {/* Booked By Info */}
                  {appointment.bookedBy && (
                    <div className="text-xs text-text-muted pt-2 flex items-center gap-1.5">
                      <span>Booked by staff:</span>
                      <strong className="text-text font-medium">
                        {appointment.bookedBy.name || appointment.bookedBy.email}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Consultation Notes Section */}
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h2 className="font-semibold text-base text-text flex items-center gap-2">
                        <FiFileText className="h-4 w-4 text-primary" />
                        Clinical Consultation Notes
                      </h2>
                      <p className="text-xs text-text-muted mt-0.5">
                        Clinical findings, diagnosis, prescriptions, or follow-up instructions.
                      </p>
                    </div>

                    {isDoctor || isSuperAdmin ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={!isNotesDirty && !notes}
                        loading={updateMutation.isPending}
                        className="gap-1.5 shadow-sm"
                      >
                        <FiSave className="h-3.5 w-3.5" />
                        <span>Save Notes</span>
                      </Button>
                    ) : null}
                  </div>

                  {/* Doctor or Super Admin: Editable Notes Area */}
                  {isDoctor || isSuperAdmin ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={6}
                        placeholder="Write clinical consultation notes, prescriptions, diagnosis, and observations here..."
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          setIsNotesDirty(true);
                        }}
                        disabled={updateMutation.isPending || currentStatus === "cancelled"}
                        className="font-sans text-sm leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>
                          {isNotesDirty ? (
                            <span className="text-amber-500 font-medium">Unsaved changes</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">All changes saved</span>
                          )}
                        </span>
                        <span>{notes.length} / 2000 characters</span>
                      </div>
                    </div>
                  ) : (
                    /* Receptionist: Read-Only Display */
                    <div className="p-4 rounded-lg border border-border bg-surface-secondary/40 text-sm text-text leading-relaxed min-h-[100px]">
                      {appointment.notes ? (
                        <p className="whitespace-pre-wrap">{appointment.notes}</p>
                      ) : (
                        <p className="italic text-text-muted">
                          No consultation notes recorded yet by the attending doctor.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (1 col): Patient Details Card */}
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h2 className="font-semibold text-base text-text flex items-center gap-2">
                      <FiUser className="h-4 w-4 text-primary" />
                      Patient Chart
                    </h2>
                    {patientId && (
                      <Link
                        href={`/patients/${patientId}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Full Chart</span>
                        <FiExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar name={patient.name || "Patient"} size="lg" />
                    <div>
                      <h3 className="font-bold text-base text-text">{patient.name || "Patient"}</h3>
                      <p className="font-mono text-xs text-primary font-semibold">
                        MRN: {patient.patientId || patientId || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-sm">
                    <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                      <span className="text-text-muted text-xs">Age / DOB</span>
                      <span className="font-medium text-text">
                        {patientAge !== null ? `${patientAge} yrs` : "—"}
                        {patient.dateOfBirth && (
                          <span className="text-xs text-text-muted ml-1">
                            ({formatDate(patient.dateOfBirth, { dateOnly: true })})
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                      <span className="text-text-muted text-xs">Gender</span>
                      <span className="font-medium text-text capitalize">
                        {patient.gender || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                      <span className="text-text-muted text-xs">Mobile Phone</span>
                      <span className="font-mono font-medium text-text">
                        {patient.mobile || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-text-muted text-xs">Chart Status</span>
                      <Badge
                        variant={patient.isActive !== false ? "success" : "secondary"}
                        size="sm"
                      >
                        {patient.isActive !== false ? "Active Patient" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  {patientId && (
                    <div className="pt-2">
                      <Link href={`/patients/${patientId}`} className="w-full block">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <span>View Complete Medical Records</span>
                          <FiExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Status Notice Card */}
                {isCancelled && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                      <FiAlertCircle className="h-4 w-4 shrink-0" />
                      <span>Appointment Cancelled</span>
                    </div>
                    <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                      This appointment was cancelled. Its reserved consultation slot has been released back to the clinic&apos;s bookable schedule.
                    </p>
                  </div>
                )}

                {isCompleted && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                      <FiCheckCircle className="h-4 w-4 shrink-0" />
                      <span>Consultation Completed</span>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 leading-relaxed">
                      The patient consultation has been officially completed and finalized by the attending medical staff.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-text-muted text-base">Appointment not found or you do not have permission to view it.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/appointments")}
              className="mt-4"
            >
              Back to Appointments
            </Button>
          </div>
        )}

        {/* Cancel Appointment Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleConfirmCancel}
          title="Cancel Appointment"
          description={`Are you sure you want to cancel the appointment for ${
            patient.name || "this patient"
          }? The reserved slot (${timeSlotStr}) will be immediately freed up for other bookings.`}
          confirmText="Yes, Cancel Appointment"
          cancelText="Keep Appointment"
          variant="danger"
          loading={cancelMutation.isPending}
        />

        {/* Complete Appointment Modal for Doctor / Admin */}
        <Modal
          isOpen={showCompleteModal}
          onClose={() => {
            if (!completeMutation.isPending) setShowCompleteModal(false);
          }}
          title="Complete Consultation"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Mark consultation as completed for{" "}
              <strong className="text-text font-semibold">
                {patient.name || "Patient"}
              </strong>
              . You may finalize clinical notes below before closing the consultation.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wider">
                Consultation Notes
              </label>
              <Textarea
                rows={5}
                placeholder="Enter diagnosis, prescribed medications, follow-up instructions..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                disabled={completeMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleteModal(false)}
                disabled={completeMutation.isPending}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmComplete}
                loading={completeMutation.isPending}
              >
                <FiCheckCircle className="h-4 w-4" />
                <span>Mark as Completed</span>
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </PermissionGate>
  );
}
