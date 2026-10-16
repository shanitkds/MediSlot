"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FiUserCheck,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiPlus,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import {
  useDashboardSummary,
  useTodayAppointments,
  useUpcomingAppointments,
} from "@/hooks/queries/useDashboardQuery";
import {
  useMarkAppointmentArrived,
  useMarkAppointmentCompleted,
} from "@/hooks/queries/useAppointmentQuery";
import { useSlots } from "@/hooks/queries/useSlotQuery";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useToast } from "@/contexts/ToastProvider";
import { StatCard } from "./StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatDate } from "@/lib/utils";

function formatAppointmentTime(item) {
  if (item.slot?.startAt) {
    const date = new Date(item.slot.startAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (item.appointmentDate) {
    const date = new Date(item.appointmentDate);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return "Scheduled";
}

export function ReceptionistDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("today"); // "today" | "upcoming"

  // Live Backend Queries
  const {
    data: summaryData,
    isLoading: loadingSummary,
    refetch: refetchSummary,
    isFetching: isFetchingSummary,
  } = useDashboardSummary();

  const {
    data: todayAppointmentsData,
    isLoading: loadingToday,
    refetch: refetchToday,
    isFetching: isFetchingToday,
  } = useTodayAppointments();

  const {
    data: upcomingAppointmentsData,
    isLoading: loadingUpcoming,
    refetch: refetchUpcoming,
    isFetching: isFetchingUpcoming,
  } = useUpcomingAppointments({ limit: 15 });

  const { data: slotsData, isLoading: loadingSlots, refetch: refetchSlots } = useSlots();
  const { data: doctorsData, isLoading: loadingDoctors, refetch: refetchDoctors } = useDoctors();

  // Real Appointment Mutations
  const markArrivedMutation = useMarkAppointmentArrived({
    onSuccess: () => {
      toast.success("Patient successfully checked in!");
      refetchToday();
      refetchSummary();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to check in patient");
    },
  });

  const markCompletedMutation = useMarkAppointmentCompleted({
    onSuccess: () => {
      toast.success("Consultation marked as completed.");
      refetchToday();
      refetchSummary();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to complete appointment");
    },
  });

  // Extract Live Data from API responses
  const summary = summaryData?.data?.summary || summaryData?.summary || {};
  const statusCounts = summaryData?.data?.appointmentCountsByStatus || summaryData?.appointmentCountsByStatus || {};
  const todayAppointments = todayAppointmentsData?.data?.appointments || todayAppointmentsData?.appointments || [];
  const upcomingAppointments = upcomingAppointmentsData?.data?.items || upcomingAppointmentsData?.items || [];

  // Slots computation from real database
  const allSlots = slotsData?.data?.items || slotsData?.data?.slots || [];
  const availableSlotsCount = allSlots.filter((s) => s.status === "available").length;

  const totalDoctorsCount =
    doctorsData?.data?.pagination?.total ??
    doctorsData?.data?.total ??
    doctorsData?.data?.items?.length ??
    doctorsData?.data?.doctors?.length ??
    0;

  // Real stat metrics without fallbacks
  const totalTodayAppointments = summary.todayAppointments ?? todayAppointments.length;
  const arrivedCount = summary.arrivedPatients ?? statusCounts.arrived ?? todayAppointments.filter((q) => q.status === "arrived").length;
  const pendingCount = summary.pendingAppointments ?? statusCounts.scheduled ?? todayAppointments.filter((q) => q.status === "scheduled").length;

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchSummary(),
        refetchToday(),
        refetchUpcoming(),
        refetchSlots(),
        refetchDoctors(),
      ]);
      toast.success("Receptionist dashboard updated");
    } catch {
      toast.error("Failed to refresh dashboard");
    }
  };

  const handleCheckIn = (item) => {
    markArrivedMutation.mutate(item._id);
  };

  const handleComplete = (item) => {
    markCompletedMutation.mutate({ id: item._id, notes: "Completed by reception desk" });
  };

  const isRefreshing = isFetchingSummary || isFetchingToday || isFetchingUpcoming;

  return (
    <div className="space-y-6">
      {/* Reception Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border bg-gradient-to-r from-surface to-emerald-50/20 dark:to-emerald-950/20 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white text-xs">
              <FiCheckCircle />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Reception Desk Station
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-text">
            Front Desk & Patient Check-In
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            Register arriving patients, manage appointments, and verify doctor availability in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            leftIcon={<FiRefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />}
          >
            Refresh
          </Button>

          <Link href="/patients/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
            >
              Register New Patient
            </Button>
          </Link>

          <Link href="/slots">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiCalendar className="h-3.5 w-3.5" />}
            >
              Book Slot
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards with live API metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={totalTodayAppointments}
          icon={<FiCalendar />}
          color="primary"
          change={pendingCount > 0 ? `${pendingCount} Scheduled pending` : "All processed"}
          changeType={pendingCount > 0 ? "increase" : "neutral"}
          description="Total consultations today"
          loading={loadingSummary || loadingToday}
        />

        <StatCard
          title="Checked-In Patients"
          value={arrivedCount}
          icon={<FiUserCheck />}
          color="success"
          change={arrivedCount > 0 ? `${arrivedCount} Waiting in lounge` : "No patients waiting"}
          changeType={arrivedCount > 0 ? "increase" : "neutral"}
          description="Ready for consultation"
          loading={loadingSummary}
        />

        <StatCard
          title="Available Slots"
          value={availableSlotsCount}
          icon={<FiClock />}
          color="warning"
          change={availableSlotsCount > 0 ? `${availableSlotsCount} Bookable open` : "No open slots"}
          changeType="neutral"
          description="Open for booking"
          loading={loadingSlots}
        />

        <StatCard
          title="Active Doctors"
          value={totalDoctorsCount}
          icon={<FaUserMd />}
          color="indigo"
          change={totalDoctorsCount > 0 ? `${totalDoctorsCount} On duty` : "None configured"}
          changeType="neutral"
          description="Clinical departments"
          loading={loadingDoctors}
        />
      </div>

      {/* Appointments Management: Tabbed View (Today's Queue / Upcoming Appointments) */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="font-display text-base font-semibold text-text">
              {activeTab === "today" ? "Today's Patient Queue" : "Upcoming Scheduled Appointments"}
            </h4>
            <p className="text-xs text-muted">
              {activeTab === "today"
                ? "Live patient arrivals, check-ins, and consultation progress for today"
                : "Future patient appointments booked across clinic departments"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("today")}
                className={cn(
                  "rounded px-3 py-1 font-medium transition-colors cursor-pointer",
                  activeTab === "today"
                    ? "bg-surface text-text shadow-sm font-semibold"
                    : "text-muted hover:text-text"
                )}
              >
                Today ({todayAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "rounded px-3 py-1 font-medium transition-colors cursor-pointer",
                  activeTab === "upcoming"
                    ? "bg-surface text-text shadow-sm font-semibold"
                    : "text-muted hover:text-text"
                )}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
            </div>

            <Link href="/patients">
              <Button variant="ghost" size="sm" className="text-xs">
                All Patients
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab 1: Today's Queue */}
        {activeTab === "today" && (
          loadingToday ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <FiRefreshCw className="h-6 w-6 text-primary animate-spin" />
              <p className="text-xs text-muted">Loading today&apos;s queue...</p>
            </div>
          ) : todayAppointments.length === 0 ? (
            <EmptyState
              title="No appointments scheduled today"
              description="There are currently no patient appointments booked for today. You can register a new patient or book a slot."
              actionLabel="Book Appointment Slot"
              onAction={() => {
                window.location.href = "/slots";
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50/60 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor & Dept</th>
                    <th className="px-4 py-3">Scheduled Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayAppointments.map((item) => {
                    const patientName = item.patient?.name || "Patient";
                    const patientPhone = item.patient?.mobile || "No phone";
                    const doctorName = item.doctor?.name || "Assigned Doctor";
                    const department = item.department?.name || "General Clinic";
                    const time = formatAppointmentTime(item);

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                              <FiUser className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text text-xs sm:text-sm truncate">
                                {patientName}
                              </p>
                              <p className="text-[11px] text-muted">{patientPhone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-text text-xs sm:text-sm">{doctorName}</p>
                          <p className="text-[11px] text-muted">{department}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-medium text-xs text-text">
                            <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                            {time}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} size="sm" />
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {item.status === "scheduled" ? (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleCheckIn(item)}
                              disabled={markArrivedMutation.isPending}
                              leftIcon={<FiUserCheck className="h-3 w-3" />}
                            >
                              Check In
                            </Button>
                          ) : item.status === "arrived" || item.status === "checked_in" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium mr-1">
                                In Waiting Lounge
                              </span>
                              <Button
                                variant="success"
                                size="xs"
                                onClick={() => handleComplete(item)}
                                disabled={markCompletedMutation.isPending}
                                leftIcon={<FiCheckCircle className="h-3 w-3" />}
                              >
                                Complete
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <FiCheckCircle className="h-3.5 w-3.5" /> Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Upcoming Appointments */}
        {activeTab === "upcoming" && (
          loadingUpcoming ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <FiRefreshCw className="h-6 w-6 text-primary animate-spin" />
              <p className="text-xs text-muted">Loading upcoming appointments...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming appointments"
              description="There are no future appointments scheduled at this time."
              actionLabel="Book Future Slot"
              onAction={() => {
                window.location.href = "/slots";
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50/60 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor & Dept</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {upcomingAppointments.map((item) => {
                    const patientName = item.patient?.name || "Patient";
                    const patientPhone = item.patient?.mobile || "No phone";
                    const doctorName = item.doctor?.name || "Assigned Doctor";
                    const department = item.department?.name || "General Clinic";
                    const time = formatAppointmentTime(item);
                    const apptDate = item.appointmentDate ? formatDate(item.appointmentDate) : "Upcoming";

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                              <FiUser className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text text-xs sm:text-sm truncate">
                                {patientName}
                              </p>
                              <p className="text-[11px] text-muted">{patientPhone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-text text-xs sm:text-sm">{doctorName}</p>
                          <p className="text-[11px] text-muted">{department}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-xs text-text">{apptDate}</p>
                          <p className="text-[11px] text-muted flex items-center gap-1">
                            <FiClock className="h-3 w-3" /> {time}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-muted">
                          {item.purpose || "General Consultation"}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
