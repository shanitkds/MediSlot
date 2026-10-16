"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DoctorScheduleCalendar } from "@/components/medical/DoctorScheduleCalendar";
import { useDoctor } from "@/hooks/queries/useDoctorQuery";
import { useDoctorSchedule } from "@/hooks/queries/useDoctorScheduleQuery";
import { FiCalendar, FiClock, FiPlusCircle } from "react-icons/fi";

export function DoctorScheduleSubView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const { data: docData, isLoading: loadingDoc } = useDoctor(id);
  const doctor = docData?.data?.doctor || docData?.data || null;

  const { data: schedData, isLoading: loadingSched, error, refetch } = useDoctorSchedule(id);
  const schedule = schedData?.data?.schedule || schedData?.data || null;

  const name = doctor?.userId?.name || doctor?.user?.name || doctor?.name || "Doctor";
  const isNotFound = error?.status === 404 || error?.statusCode === 404 || error?.message?.toLowerCase().includes("not found");

  const effectiveSchedule = schedule || {
    workingDays: [1, 2, 3, 4, 5],
    sessions: [{ startTime: "09:00", endTime: "17:00" }],
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
    slotDurationMinutes: doctor?.consultationDuration || 15,
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin", "receptionist", "doctor"]}
      permission={PERMISSIONS.DOCTORSCHEDULE_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title={`Schedule: Dr. ${name}`}
            description="Working days, sessions, breaks, and bookable consultation windows."
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/doctors/${id}`)}>
              Doctor Profile
            </Button>
            <Link href={`/slots/generate?doctorId=${id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FiClock className="h-3.5 w-3.5 text-primary" />
                Generate Slots
              </Button>
            </Link>
            <Link href={`/schedules/${id}`}>
              <Button variant="primary" size="sm" className="gap-1.5">
                <FiCalendar className="h-3.5 w-3.5" />
                {schedule ? "Edit Schedule" : "Configure Schedule"}
              </Button>
            </Link>
          </div>
        </div>

        {!schedule && !loadingSched && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 text-xs">
            <div className="flex items-center gap-2.5">
              <FiClock className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>No custom schedule configured yet:</strong> Dr. {name} is currently using standard hospital hours (Monday–Friday, 09:00 AM – 05:00 PM).
              </span>
            </div>
            <Link href={`/schedules/${id}`} className="shrink-0">
              <Button variant="primary" size="xs" className="gap-1">
                <FiPlusCircle className="h-3 w-3" />
                Setup Custom Hours
              </Button>
            </Link>
          </div>
        )}

        {loadingDoc || loadingSched ? (
          <LoadingState message="Loading timetable schedule..." fullPage={false} />
        ) : error && !isNotFound ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <DoctorScheduleCalendar schedule={effectiveSchedule} doctor={doctor} onEdit={() => router.push(`/schedules/${id}`)} />
        )}
      </PageContainer>
    </PermissionGate>
  );
}
