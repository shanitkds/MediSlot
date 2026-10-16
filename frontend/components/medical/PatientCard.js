import React from "react";
import {
  FiPhone,
  FiCalendar,
  FiEdit2,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function PatientCard({
  patient,
  onBookSlot,
  onViewHistory,
  onEdit,
  className,
}) {
  if (!patient) return null;

  const age = calculateAge(patient.dateOfBirth);
  const status = patient.status || (patient.isActive !== false ? "active" : "inactive");

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="space-y-4">
        {/* Top: Avatar, Name, ID & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={patient.name} size="md" className="ring-2 ring-emerald-500/20" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display text-base font-bold text-text leading-tight">
                  {patient.name}
                </h4>
                <Badge variant="outline" size="sm" className="font-mono text-[10px] py-0 px-1.5 font-semibold">
                  {patient.patientId || "PT"}
                </Badge>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span className="capitalize">{patient.gender || "Unspecified"}</span>
                {age !== null && (
                  <>
                    <span>•</span>
                    <span>{age} yrs</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <StatusBadge status={status} size="sm" />
        </div>

        {/* Middle: Phone & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted">
            <FiPhone className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-text truncate">{patient.mobile || "No phone"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted">
            <FiCalendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="font-medium text-text truncate">
              {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "DOB unlisted"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: Actions */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/70 pt-4">
        {onEdit && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onEdit(patient)}
            leftIcon={<FiEdit2 />}
          >
            Edit
          </Button>
        )}

        {onViewHistory && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => onViewHistory(patient)}
            leftIcon={<FiClock />}
          >
            History
          </Button>
        )}

        {onBookSlot && (
          <Button
            variant="primary"
            size="xs"
            onClick={() => onBookSlot(patient)}
            leftIcon={<FiCheckCircle />}
          >
            Book Slot
          </Button>
        )}
      </div>
    </div>
  );
}
