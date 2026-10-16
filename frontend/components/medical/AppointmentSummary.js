"use client";

import React from "react";
import {
  FiUser,
  FiCalendar,
  FiClock,
  FiLayers,
  FiCheck,
  FiPrinter,
  FiX,
  FiShield,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastProvider";
import { cn } from "@/lib/utils";

export function AppointmentSummary({
  patient,
  doctor,
  slot,
  department,
  status = "booked",
  onConfirm,
  onCancel,
  className,
}) {
  const toast = useToast();

  const handlePrint = () => {
    window.print();
    toast.success("Printing appointment slip...");
  };

  const patientName = patient?.name || "Patient";
  const patientId = patient?.patientId || "PT";
  const doctorName = doctor?.name ? `Dr. ${doctor.name.replace(/^Dr\.\s*/i, "")}` : "Doctor";
  const deptName = department?.name || doctor?.departmentName || "General OPD";

  const slotDate = slot?.startAt
    ? new Date(slot.startAt).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Scheduled Date";

  const startTime = slot?.startAt
    ? new Date(slot.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : "";

  const endTime = slot?.endAt
    ? new Date(slot.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : "";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-6 shadow-md space-y-6 text-left",
        className
      )}
    >
      {/* Top Banner */}
      <div className="flex items-start justify-between border-b border-border/80 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            MediSlot Appointment Slip
          </span>
          <h3 className="font-display text-lg font-bold text-text mt-0.5">
            Consultation Booking Details
          </h3>
        </div>

        <AppointmentStatusBadge status={status} size="md" />
      </div>

      {/* Grid of Medical Entities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Patient Block */}
        <div className="rounded-lg border border-border/70 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
            <FiUser className="h-3.5 w-3.5 text-primary" />
            <span>Patient Information</span>
          </div>
          <p className="font-bold text-text text-sm">{patientName}</p>
          <p className="text-xs text-muted font-mono">ID: {patientId}</p>
          {patient?.mobile && <p className="text-xs text-muted">Phone: {patient.mobile}</p>}
        </div>

        {/* Doctor Block */}
        <div className="rounded-lg border border-border/70 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
            <FaUserMd className="h-3.5 w-3.5 text-indigo-500" />
            <span>Consulting Physician</span>
          </div>
          <p className="font-bold text-text text-sm">{doctorName}</p>
          <p className="text-xs text-muted">{doctor?.specialization || "Clinical Consultant"}</p>
          <div className="flex items-center gap-1 text-xs text-primary font-medium pt-0.5">
            <FiLayers className="h-3 w-3" />
            <span>{deptName}</span>
          </div>
        </div>
      </div>

      {/* Time & Slot Details */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-text">{slotDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <FiClock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-bold text-primary">
              {startTime} {endTime ? `— ${endTime}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-border/80 pt-4 flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          leftIcon={<FiPrinter className="h-3.5 w-3.5" />}
        >
          Print Slip
        </Button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              leftIcon={<FiX className="h-3.5 w-3.5" />}
              className="text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Cancel Booking
            </Button>
          )}

          {onConfirm && (
            <Button
              variant="primary"
              size="sm"
              onClick={onConfirm}
              leftIcon={<FiCheck className="h-3.5 w-3.5" />}
            >
              Confirm Appointment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
