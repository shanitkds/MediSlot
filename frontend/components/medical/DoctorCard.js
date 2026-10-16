import React from "react";
import {
  FiClock,
  FiCalendar,
  FiLayers,
  FiEdit2,
  FiCheckCircle,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

export function DoctorCard({
  doctor,
  onViewSchedule,
  onBookSlot,
  onEdit,
  className,
}) {
  if (!doctor) return null;

  const name = doctor.userId?.name || doctor.name || "Doctor";
  const email = doctor.userId?.email || doctor.email || "";
  const deptName = doctor.departmentId?.name || doctor.departmentName || "General Medicine";
  const duration = doctor.consultationDuration || 15;
  const status = doctor.status || (doctor.isActive !== false ? "active" : "disabled");

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="space-y-4">
        {/* Top: Avatar, Name, Specialization & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={name} size="md" className="ring-2 ring-primary/20" />
            <div>
              <h4 className="font-display text-base font-bold text-text leading-tight">
                Dr. {name.replace(/^Dr\.\s*/i, "")}
              </h4>
              <p className="text-xs font-medium text-primary mt-0.5">
                {doctor.specialization || "Physician"}
              </p>
              {email && (
                <p className="text-[11px] text-muted truncate max-w-[160px] sm:max-w-xs">{email}</p>
              )}
            </div>
          </div>

          <StatusBadge status={status} size="sm" />
        </div>

        {/* Middle Details: Department & Consultation Duration */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted">
            <FiLayers className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate font-medium text-text">{deptName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted">
            <FiClock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate font-medium text-text">{duration} mins / slot</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/70 pt-4">
        {onEdit && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onEdit(doctor)}
            leftIcon={<FiEdit2 />}
          >
            Edit
          </Button>
        )}

        {onViewSchedule && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => onViewSchedule(doctor)}
            leftIcon={<FiCalendar />}
          >
            Schedule
          </Button>
        )}

        {onBookSlot && (
          <Button
            variant="primary"
            size="xs"
            onClick={() => onBookSlot(doctor)}
            leftIcon={<FiCheckCircle />}
          >
            Book Slot
          </Button>
        )}
      </div>
    </div>
  );
}
