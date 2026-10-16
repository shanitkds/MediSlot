"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { DoctorSelect } from "@/components/medical/DoctorSelect";
import { SlotCalendar } from "@/components/medical/SlotCalendar";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useSlots } from "@/hooks/queries/useSlotQuery";
import { useAppointmentSocket } from "@/hooks/useAppointmentSocket";
import { useAuth } from "@/contexts/AuthProvider";
import { formatDate } from "@/lib/utils";
import { FiClock, FiPlus, FiEye, FiCheckCircle, FiLock, FiRefreshCw } from "react-icons/fi";

export function SlotsView() {
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.SLOTS_CREATE);

  // Automatically refresh slots when appointments are booked or cancelled in real time
  useAppointmentSocket();

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("");
  const [onlyFuture, setOnlyFuture] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const queryParams = {
    limit: 100,
    ...(selectedDoctorId ? { doctorId: selectedDoctorId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    ...(status ? { status } : {}),
    ...(onlyFuture ? { onlyFuture: true } : {}),
  };

  const {
    data: slotsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSlots(queryParams);

  const slots = slotsData?.data?.items || slotsData?.data?.slots || slotsData?.data || [];

  const columns = [
    {
      key: "time",
      label: "Slot Window",
      render: (row) => {
        const start = row.startAt ? formatDate(row.startAt, { time: true }) : row.startTime || "—";
        const end = row.endAt ? formatDate(row.endAt, { time: true }) : row.endTime || "—";
        return (
          <div className="flex items-center gap-2">
            <FiClock className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs font-semibold text-text">
              {start} – {end}
            </span>
          </div>
        );
      },
    },
    {
      key: "doctor",
      label: "Doctor",
      render: (row) => {
        const docName = row.doctor?.user?.name || row.doctor?.name || "Practitioner";
        return <span className="text-xs font-medium text-text">Dr. {docName}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      className: "w-32",
      render: (row) => {
        const isAvail = row.status === "available";
        return (
          <Badge variant={isAvail ? "success" : "secondary"} size="sm">
            {row.status || "available"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-28 text-right",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Link href={`/slots/${id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted hover:text-primary">
                <FiEye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.SLOTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="Slot Generator & Times"
          description="View available appointment time slots, booked consultation windows, and doctor availability."
        />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 sm:max-w-md">
            <DoctorSelect
              value={selectedDoctorId}
              onChange={(id) => setSelectedDoctorId(id)}
              label="Doctor Filter"
              placeholder="All Doctors"
            />

            <Select
              label="Availability Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available Slots Only</option>
              <option value="booked">Booked Slots Only</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => refetch()}
              loading={isFetching}
              title="Refresh slots"
              className="h-10 px-3"
            >
              <FiRefreshCw className={isFetching ? "animate-spin h-4 w-4" : "h-4 w-4"} />
            </Button>

            {canCreate && (
              <Link href="/slots/generate">
                <Button variant="primary" size="md" className="gap-2 h-10 whitespace-nowrap">
                  <FiPlus className="h-4 w-4" />
                  Generate Daily Slots
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Interactive Calendar Strip */}
        <SlotCalendar
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={(slot) => setSelectedSlotId(slot.id || slot._id)}
          loading={isLoading}
        />

        {/* Detailed Slots Table */}
        <DataTable
          columns={columns}
          data={slots}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No slots found for this date"
          emptyMessage="Use the Generate Daily Slots tool to create consultation windows from the doctor's schedule."
          emptyIcon={<FiClock className="h-8 w-8 text-muted" />}
        />
      </PageContainer>
    </PermissionGate>
  );
}
