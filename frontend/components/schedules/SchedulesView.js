"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { DoctorSelect } from "@/components/medical/DoctorSelect";
import { DoctorScheduleCalendar } from "@/components/medical/DoctorScheduleCalendar";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useDoctorSchedule } from "@/hooks/queries/useDoctorScheduleQuery";
import { useAuth } from "@/contexts/AuthProvider";
import { FiCalendar, FiPlus, FiEdit, FiClock } from "react-icons/fi";

export function SchedulesView() {
  const { user, can } = useAuth();
  const canCreate = can(PERMISSIONS.DOCTORSCHEDULE_CREATE);

  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors({ limit: 100 });
  const doctors = React.useMemo(
    () => doctorsData?.data?.items || doctorsData?.data?.doctors || doctorsData?.data || [],
    [doctorsData]
  );

  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      const firstId = doctors[0].id || doctors[0]._id;
      setSelectedDoctorId(firstId);
    }
  }, [doctors, selectedDoctorId]);

  const selectedDoctor = doctors.find(
    (d) => (d.id || d._id) === selectedDoctorId
  );

  const {
    data: schedData,
    isLoading: loadingSched,
    error,
    refetch,
  } = useDoctorSchedule(selectedDoctorId, { enabled: Boolean(selectedDoctorId) });

  const schedule = schedData?.data?.schedule || schedData?.data || null;

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.DOCTORSCHEDULE_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="Doctor Working Schedules"
          description="Weekly recurring practice hours, working day sessions, and consultation break rules."
        />

        {/* Doctor Selection & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="w-full sm:max-w-xs">
            <DoctorSelect
              value={selectedDoctorId}
              onChange={(id) => setSelectedDoctorId(id)}
              placeholder="Select doctor timetable..."
              label="Select Practitioner"
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedDoctorId && (
              <Link href={`/schedules/${selectedDoctorId}`}>
                <Button variant="outline" size="md" className="gap-2">
                  <FiEdit className="h-4 w-4" />
                  Edit Schedule
                </Button>
              </Link>
            )}

            {canCreate && (
              <Link href="/schedules/new">
                <Button variant="primary" size="md" className="gap-2">
                  <FiPlus className="h-4 w-4" />
                  Configure New Schedule
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Calendar Timetable Preview */}
        {loadingDoctors || loadingSched ? (
          <LoadingState message="Loading timetable schedule..." fullPage={false} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <DoctorScheduleCalendar schedule={schedule} doctor={selectedDoctor} />
        )}
      </PageContainer>
    </PermissionGate>
  );
}
