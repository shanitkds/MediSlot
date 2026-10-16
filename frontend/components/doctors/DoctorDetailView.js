"use client";

import React, { use, useState } from "react";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDoctor, useDeleteDoctor, useUpdateDoctor } from "@/hooks/queries/useDoctorQuery";
import { useDoctorSchedule } from "@/hooks/queries/useDoctorScheduleQuery";
import { useToast } from "@/contexts/ToastProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { formatDate } from "@/lib/utils";
import { FaUserMd } from "react-icons/fa";
import {
  FiCalendar,
  FiClock,
  FiLayers,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiMail,
} from "react-icons/fi";

const DAY_MAP = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
  7: "Sun",
};

function formatWorkingDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "Mon, Tue, Wed, Thu, Fri";
  return days
    .map((d) => (typeof d === "number" ? DAY_MAP[d] || d : String(d)))
    .join(", ");
}

export function DoctorDetailView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.DOCTORS_UPDATE);
  const canDelete = can(PERMISSIONS.DOCTORS_DELETE);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);

  const { data: docData, isLoading, error, refetch } = useDoctor(id);
  const doctor = docData?.data?.doctor || docData?.data || null;

  const deleteMutation = useDeleteDoctor();
  const updateMutation = useUpdateDoctor();

  const doctorId = doctor?.id || doctor?._id || id;
  const { data: schedData } = useDoctorSchedule(doctorId, { enabled: Boolean(doctorId) });
  const schedule = schedData?.data?.schedule || schedData?.data || null;

  const name = doctor?.userId?.name || doctor?.user?.name || doctor?.name || "Doctor";
  const email = doctor?.userId?.email || doctor?.user?.email || doctor?.email || "";
  const deptName = doctor?.departmentId?.name || doctor?.department?.name || "Unassigned";
  const isActive = doctor?.status === "active" || doctor?.isActive;

  const handleActivate = async () => {
    try {
      await updateMutation.mutateAsync({ id: doctorId, status: "active" });
      toast.success("Doctor profile activated successfully.");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to activate doctor profile.");
    }
  };

  const handleDeleteConfirm = async () => {
    const isAlreadyDisabled = !isActive;
    const shouldPermanentlyDelete = permanentDelete || isAlreadyDisabled;

    try {
      const res = await deleteMutation.mutateAsync({ id: doctorId, permanent: shouldPermanentlyDelete });
      if (shouldPermanentlyDelete || res?.data?.deleted) {
        toast.success("Doctor profile permanently deleted.");
      } else {
        toast.success("Doctor profile deactivated successfully.");
      }
      setDeleteOpen(false);
      router.push("/doctors");
    } catch (err) {
      toast.error(err?.message || "Failed to delete doctor.");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin", "receptionist", "doctor"]}
      permission={PERMISSIONS.DOCTORS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />

        {isLoading ? (
          <LoadingState message="Loading doctor profile..." fullPage={false} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} title="Failed to load doctor profile" />
        ) : doctor ? (
          <div className="space-y-6">
            {/* Header Profile Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar name={name} size="lg" className="h-16 w-16 text-lg" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display text-2xl font-bold text-text">
                        Dr. {name}
                      </h1>
                      <Badge variant={isActive ? "success" : "secondary"} size="md">
                        {isActive ? "Active Practitioner" : "Inactive / Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-primary mt-0.5">
                      {doctor.specialization || "General Specialist"}
                    </p>
                    {email && (
                      <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
                        <FiMail className="h-3.5 w-3.5" />
                        <span>{email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push("/doctors")}>
                    Back to List
                  </Button>

                  <Link href={`/doctors/${doctorId}/schedule`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-indigo-500">
                      <FiCalendar className="h-3.5 w-3.5" />
                      View Schedule
                    </Button>
                  </Link>

                  {canUpdate && (
                    <Link href={`/doctors/${doctorId}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-amber-500">
                        <FiEdit className="h-3.5 w-3.5" />
                        Edit Profile
                      </Button>
                    </Link>
                  )}

                  {!isActive && canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleActivate}
                      className="gap-1.5 text-emerald-600 hover:text-emerald-700"
                    >
                      <FiCheckCircle className="h-3.5 w-3.5" />
                      Reactivate
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteOpen(true);
                        setPermanentDelete(!isActive);
                      }}
                      className="gap-1.5 text-danger hover:bg-danger/10"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      {isActive ? "Deactivate" : "Delete"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Department & Details Bar */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/80 pt-5 text-xs">
                <div>
                  <span className="text-muted block">Clinical Department</span>
                  <p className="text-sm font-semibold text-text mt-0.5">{deptName}</p>
                </div>
                <div>
                  <span className="text-muted block">Appointment Duration</span>
                  <p className="text-sm font-semibold text-text mt-0.5">
                    {doctor.consultationDuration || doctor.slotDurationMinutes || 15} minutes
                  </p>
                </div>
                <div>
                  <span className="text-muted block">Profile Registered</span>
                  <p className="text-sm font-semibold text-text mt-0.5">
                    {formatDate(doctor.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor's Working Schedule Quick Preview */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-text">
                    Assigned Working Days & Hours
                  </h2>
                  <p className="text-xs text-muted">
                    Recurring practice availability configured in the schedule module.
                  </p>
                </div>
                <Link href={`/schedules/${doctorId}`}>
                  <Button variant="outline" size="sm">
                    Configure Schedule
                  </Button>
                </Link>
              </div>

              {schedule ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted">Working Days</span>
                    <p className="text-sm font-semibold text-text mt-0.5 capitalize">
                      {formatWorkingDays(schedule.workingDays)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted">Slot Duration</span>
                    <p className="text-sm font-semibold text-text mt-0.5">
                      {schedule.slotDurationMinutes || 15} mins / patient
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted">Working Sessions</span>
                    <p className="text-sm font-semibold text-text mt-0.5">
                      {schedule.sessions?.length || 1} session daily
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted">Break Durations</span>
                    <p className="text-sm font-semibold text-text mt-0.5">
                      {schedule.breaks?.length ? `${schedule.breaks.length} break(s)` : "None"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted">
                  No custom schedule configured yet. Default hospital timetable applies.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted">
            Doctor profile not found.
          </div>
        )}

        {/* Delete / Deactivate Confirm */}
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setPermanentDelete(false);
          }}
          title={
            permanentDelete || !isActive
              ? `Permanently Delete Dr. ${name}?`
              : `Deactivate Dr. ${name}?`
          }
          description={
            permanentDelete || !isActive
              ? "This will permanently remove this doctor profile and unbooked slots from the database (only permitted if zero appointments exist)."
              : "Deactivating this doctor profile prevents new patient bookings while preserving appointment history."
          }
          confirmLabel={permanentDelete || !isActive ? "Delete Permanently" : "Deactivate"}
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        >
          {isActive && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <input
                type="checkbox"
                id="permDeleteDetail"
                checked={permanentDelete}
                onChange={(e) => setPermanentDelete(e.target.checked)}
                className="h-4 w-4 rounded border-border text-danger focus:ring-danger cursor-pointer"
              />
              <label htmlFor="permDeleteDetail" className="text-xs text-text select-none cursor-pointer">
                Delete permanently (only if doctor has 0 appointments)
              </label>
            </div>
          )}
        </ConfirmDialog>
      </PageContainer>
    </PermissionGate>
  );
}
