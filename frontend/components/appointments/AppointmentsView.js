"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useAppointments,
  useCancelAppointment,
  useMarkAppointmentArrived,
  useMarkAppointmentCompleted,
} from "@/hooks/queries/useAppointmentQuery";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/contexts/ToastProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { useAppointmentSocket } from "@/hooks/useAppointmentSocket";
import { normalizeRole } from "@/constants/routes";
import { formatDate } from "@/lib/utils";
import {
  FiCalendar,
  FiClock,
  FiSearch,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiFilter,
  FiUser,
  FiUserCheck,
  FiFileText,
  FiX,
} from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "arrived", label: "Arrived" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "-appointmentDate", label: "Date (Newest first)" },
  { value: "appointmentDate", label: "Date (Oldest first)" },
  { value: "-createdAt", label: "Recently Created" },
  { value: "status", label: "Status" },
];

function formatTimeSlot(startAt, endAt) {
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

  return `${startStr} - ${endStr}`;
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AppointmentsView() {
  const router = useRouter();
  const toast = useToast();
  const { user, can } = useAuth();
  const userRole = normalizeRole(user);
  const isDoctor = userRole === "doctor";
  const isReceptionist = userRole === "receptionist";
  const isSuperAdmin = userRole === "super_admin" || Boolean(user?.isSuperAdmin);

  // Real-time appointment updates via Socket.IO
  useAppointmentSocket();

  const canCreate = can(PERMISSIONS.APPOINTMENTS_CREATE) || isReceptionist || isSuperAdmin;
  const canUpdate = can(PERMISSIONS.APPOINTMENTS_UPDATE) || isDoctor || isReceptionist || isSuperAdmin;
  const canCancel = can(PERMISSIONS.APPOINTMENTS_DELETE) || isReceptionist || isSuperAdmin || isDoctor;

  // Pagination & Debounced Search
  const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 10 });
  const { value: search, setValue: setSearch, debounced: debouncedSearch } = useDebouncedSearch("", 350);

  // Filters (Defaults to today's date)
  const todayDate = getTodayDateString();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [selectedSort, setSelectedSort] = useState("-appointmentDate");

  // Dialog & Modal States
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [completeModalItem, setCompleteModalItem] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");

  // Doctors list for receptionist/admin filter dropdown
  const { data: doctorsData } = useDoctors(
    { limit: 100 },
    { enabled: !isDoctor }
  );
  const doctorsList = doctorsData?.data?.items || doctorsData?.data?.doctors || doctorsData?.data || [];

  // Query Parameters
  const queryParams = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(!isDoctor && selectedDoctorId ? { doctorId: selectedDoctorId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    ...(selectedSort ? { sort: selectedSort } : {}),
  };

  const {
    data: appointmentsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAppointments(queryParams);

  // Mutations
  const cancelMutation = useCancelAppointment();
  const arriveMutation = useMarkAppointmentArrived();
  const completeMutation = useMarkAppointmentCompleted();

  const appointments =
    appointmentsData?.data?.items ||
    appointmentsData?.data?.appointments ||
    appointmentsData?.data ||
    [];

  const pagination = appointmentsData?.data?.pagination || {
    page,
    limit,
    total: appointments.length,
    totalPages: 1,
  };

  // Actions
  const handleMarkArrived = async (appointment, e) => {
    e?.stopPropagation();
    const id = appointment._id || appointment.id;
    try {
      await arriveMutation.mutateAsync(id);
      toast.success(
        `Patient ${appointment.patientId?.name || "patient"} marked as arrived!`
      );
    } catch (err) {
      toast.error(err?.message || "Failed to mark patient as arrived");
    }
  };

  const handleOpenCancelDialog = (appointment, e) => {
    e?.stopPropagation();
    setCancelModalItem(appointment);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalItem) return;
    const id = cancelModalItem._id || cancelModalItem.id;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Appointment cancelled successfully. Reserved slot has been released.");
      setCancelModalItem(null);
    } catch (err) {
      toast.error(err?.message || "Failed to cancel appointment");
    }
  };

  const handleOpenCompleteModal = (appointment, e) => {
    e?.stopPropagation();
    setCompleteModalItem(appointment);
    setCompletionNotes(appointment.notes || "");
  };

  const handleConfirmComplete = async () => {
    if (!completeModalItem) return;
    const id = completeModalItem._id || completeModalItem.id;
    try {
      await completeMutation.mutateAsync({
        id,
        notes: completionNotes,
      });
      toast.success("Consultation completed successfully!");
      setCompleteModalItem(null);
      setCompletionNotes("");
    } catch (err) {
      toast.error(err?.message || "Failed to complete appointment");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedSort("-appointmentDate");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedDoctorId) ||
    Boolean(selectedDate) ||
    selectedSort !== "-appointmentDate";

  const columns = [
    {
      key: "patient",
      label: "Patient",
      className: "w-64",
      render: (row) => {
        const patient = row.patientId || {};
        const patientName = patient.name || "Unknown Patient";
        const patientMrn = patient.patientId || "—";
        return (
          <div className="flex items-center gap-3">
            <Avatar name={patientName} size="md" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-text truncate max-w-[170px]" title={patientName}>
                {patientName}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-primary font-medium">{patientMrn}</span>
                {patient.mobile && (
                  <span className="text-text-muted truncate max-w-[100px]">{patient.mobile}</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "doctor",
      label: "Doctor & Department",
      className: "w-56",
      render: (row) => {
        const docUser = row.doctorId?.userId || {};
        const doctorName = docUser.name ? `Dr. ${docUser.name}` : "Doctor";
        const deptName =
          row.departmentId?.name ||
          row.doctorId?.departmentId?.name ||
          "General Medicine";
        const specialization = row.doctorId?.specialization || "";

        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-text truncate max-w-[180px]" title={doctorName}>
              {doctorName}
            </span>
            <span className="text-xs text-text-muted truncate max-w-[180px]">
              {deptName}
              {specialization ? ` • ${specialization}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      key: "schedule",
      label: "Date & Time",
      className: "w-48",
      render: (row) => {
        const dateVal = row.appointmentDate || row.slotId?.startAt;
        const timeSlotStr = formatTimeSlot(row.slotId?.startAt, row.slotId?.endAt);

        return (
          <div className="flex flex-col">
            <span className="font-medium text-text text-sm">
              {formatDate(dateVal, { dateOnly: true })}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-text-muted font-mono">
              <FiClock className="h-3 w-3 shrink-0 text-primary" />
              {timeSlotStr}
            </span>
          </div>
        );
      },
    },
    {
      key: "purpose",
      label: "Purpose",
      className: "max-w-[220px]",
      render: (row) => (
        <div className="flex flex-col min-w-0">
          <span
            className="text-sm text-text truncate"
            title={row.purpose || "General Consultation"}
          >
            {row.purpose || <span className="italic text-text-muted">General Consultation</span>}
          </span>
          {row.notes && (
            <span
              className="text-xs text-text-muted truncate italic flex items-center gap-1 mt-0.5"
              title={`Notes: ${row.notes}`}
            >
              <FiFileText className="h-3 w-3 shrink-0" />
              {row.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-32",
      render: (row) => <StatusBadge status={row.status} size="md" />,
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-60 text-right",
      render: (row) => {
        const id = row._id || row.id;
        const status = row.status;

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* View Details button */}
            <Link href={`/appointments/${id}`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs px-2.5 h-8 font-medium"
                title="View Appointment Details"
              >
                <FiEye className="h-3.5 w-3.5" />
                <span>Details</span>
              </Button>
            </Link>

            {/* Receptionist / Admin: Mark as Arrived */}
            {(isReceptionist || isSuperAdmin) && status === "scheduled" && (
              <Button
                variant="primary"
                size="sm"
                className="gap-1 text-xs px-2.5 h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                title="Mark Patient as Arrived"
                disabled={arriveMutation.isPending}
                onClick={(e) => handleMarkArrived(row, e)}
              >
                <FiUserCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Arrive</span>
              </Button>
            )}

            {/* Cancel Appointment - Available before complete status is set */}
            {canCancel && (status === "scheduled" || status === "arrived") && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs px-2.5 h-8 font-medium text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                title="Cancel Appointment"
                onClick={(e) => handleOpenCancelDialog(row, e)}
              >
                <FiXCircle className="h-3.5 w-3.5 text-rose-500" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            )}

            {/* Doctor / Admin: Complete Appointment */}
            {(isDoctor || isSuperAdmin) && (status === "scheduled" || status === "arrived") && (
              <Button
                variant="primary"
                size="sm"
                className="gap-1 text-xs px-2.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                title="Complete Consultation"
                onClick={(e) => handleOpenCompleteModal(row, e)}
              >
                <FiCheckCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Complete</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.APPOINTMENTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="Appointments"
          subtitle={
            isDoctor
              ? "View and manage your assigned patient appointments and clinical consultations."
              : "Monitor clinic bookings, check-ins, consultations, and status updates."
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5"
                title="Refresh table"
              >
                <FiRefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              {canCreate && (
                <Link href="/appointments/new">
                  <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
                    <FiPlus className="h-4 w-4" />
                    <span>Book Appointment</span>
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* Doctor Scope Notice */}
        {isDoctor && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
            <FiUser className="h-4 w-4 shrink-0" />
            <span>Doctor View: Displaying only appointments booked for your schedule.</span>
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Input
                placeholder="Search purpose or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<FiSearch className="h-4 w-4 text-text-muted" />}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                aria-label="Filter by appointment status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Input
                  type="date"
                  aria-label="Filter by appointment date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-sm"
                />
              </div>
              {selectedDate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate("");
                    setPage(1);
                  }}
                  title="Clear date filter to view all appointments"
                  className="shrink-0 h-10 px-2.5 text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  View All
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(todayDate);
                    setPage(1);
                  }}
                  title="Filter by today's appointments"
                  className="shrink-0 h-10 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/5 cursor-pointer font-medium"
                >
                  Today
                </Button>
              )}
            </div>

            {/* Doctor Filter (only for Receptionists / Admins) or Sort Filter for Doctor */}
            {!isDoctor ? (
              <div>
                <select
                  aria-label="Filter by doctor"
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">All Doctors</option>
                  {doctorsList.map((doc) => {
                    const docId = doc._id || doc.id;
                    const docName = doc.userId?.name ? `Dr. ${doc.userId.name}` : "Doctor";
                    const dept = doc.departmentId?.name ? ` (${doc.departmentId.name})` : "";
                    return (
                      <option key={docId} value={docId}>
                        {docName}
                        {dept}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div>
                <select
                  aria-label="Sort appointments"
                  value={selectedSort}
                  onChange={(e) => {
                    setSelectedSort(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Filter Chips (Date & Status) & Reset Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Date:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayDate);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  selectedDate === todayDate
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-secondary text-text-muted hover:text-text hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  !selectedDate
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-secondary text-text-muted hover:text-text hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                All Dates
              </button>

              <span className="text-xs font-semibold text-text-muted ml-2 sm:ml-4">Status:</span>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(opt.value);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-secondary text-text-muted hover:text-text hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1 text-xs text-rose-500 hover:text-rose-700 h-7 px-2 cursor-pointer"
              >
                <FiX className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={appointments}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={
            selectedDate === todayDate && !search && !selectedStatus && !selectedDoctorId
              ? "No appointments scheduled for today"
              : "No appointments found"
          }
          emptyMessage={
            selectedDate === todayDate && !search && !selectedStatus && !selectedDoctorId
              ? "There are no appointments booked for today yet. You can click 'View All Dates' to view upcoming and previous appointments, or book a new appointment."
              : hasActiveFilters
              ? "No appointments match your active filter settings. Try resetting filters."
              : "There are currently no appointments booked in the system."
          }
          emptyAction={
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate("");
                    setPage(1);
                  }}
                  className="gap-1.5 cursor-pointer"
                >
                  <FiCalendar className="h-4 w-4" />
                  <span>View All Dates</span>
                </Button>
              )}
              {canCreate && (
                <Link href="/appointments/new">
                  <Button variant="primary" size="sm" className="gap-1.5 shadow-sm cursor-pointer">
                    <FiPlus className="h-4 w-4" />
                    <span>Book New Appointment</span>
                  </Button>
                </Link>
              )}
            </div>
          }
          onRowClick={(row) => {
            const id = row._id || row.id;
            router.push(`/appointments/${id}`);
          }}
          pagination={{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            onPageChange: (newPage) => setPage(newPage),
            onLimitChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
          }}
        />

        {/* Cancel Appointment Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(cancelModalItem)}
          onClose={() => setCancelModalItem(null)}
          onConfirm={handleConfirmCancel}
          title="Cancel Appointment"
          description={
            cancelModalItem
              ? `Are you sure you want to cancel the appointment for ${
                  cancelModalItem.patientId?.name || "this patient"
                } on ${formatDate(cancelModalItem.appointmentDate, { dateOnly: true })}? The reserved slot will be immediately released back to available slots.`
              : ""
          }
          confirmText="Yes, Cancel Appointment"
          cancelText="Keep Appointment"
          variant="danger"
          loading={cancelMutation.isPending}
        />

        {/* Complete Appointment Modal with Notes for Doctor */}
        <Modal
          isOpen={Boolean(completeModalItem)}
          onClose={() => {
            if (!completeMutation.isPending) {
              setCompleteModalItem(null);
              setCompletionNotes("");
            }
          }}
          title="Complete Consultation"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Mark consultation as completed for{" "}
              <strong className="text-text font-semibold">
                {completeModalItem?.patientId?.name || "Patient"}
              </strong>
              . You may record or finalize clinical consultation notes below.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wider">
                Clinical Consultation Notes
              </label>
              <Textarea
                rows={4}
                placeholder="Enter diagnosis, prescribed treatment, observations, or follow-up instructions..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                disabled={completeMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompleteModalItem(null);
                  setCompletionNotes("");
                }}
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
