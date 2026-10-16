"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FiClock,
  FiCheckCircle,
  FiUser,
  FiActivity,
  FiPlay,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiUserCheck,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthProvider";
import {
  useDashboardSummary,
  useTodayAppointments,
  useUpcomingAppointments,
} from "@/hooks/queries/useDashboardQuery";
import {
  useMarkAppointmentArrived,
  useMarkAppointmentCompleted,
} from "@/hooks/queries/useAppointmentQuery";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useToast } from "@/contexts/ToastProvider";
import { StatCard } from "./StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { normalizeRole } from "@/constants/routes";
import { cn, formatDate } from "@/lib/utils";

function formatAppointmentTime(app) {
  if (app.slot?.startAt && app.slot?.endAt) {
    const start = new Date(app.slot.startAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = new Date(app.slot.endAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} - ${end}`;
  }
  if (app.slot?.startAt) {
    return new Date(app.slot.startAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (app.appointmentDate) {
    return new Date(app.appointmentDate).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "Scheduled";
}

function getPatientAge(patient) {
  if (patient?.age) return `${patient.age} yrs`;
  if (patient?.dateOfBirth) {
    const diff = Date.now() - new Date(patient.dateOfBirth).getTime();
    const ageDate = new Date(diff);
    return `${Math.abs(ageDate.getUTCFullYear() - 1970)} yrs`;
  }
  return null;
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = normalizeRole(user) === "super_admin" || normalizeRole(user) === "admin";

  // If Admin is inspecting the doctor station, allow selecting which doctor to view
  const { data: doctorsData, isLoading: loadingDoctorsList } = useDoctors({ limit: 50 });
  const doctorsList = useMemo(
    () => doctorsData?.data?.items || doctorsData?.data?.doctors || doctorsData?.items || [],
    [doctorsData]
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    if (isAdmin && doctorsList.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctorsList[0]._id);
    }
  }, [isAdmin, doctorsList, selectedDoctorId]);

  const queryParams = isAdmin && selectedDoctorId ? { doctorId: selectedDoctorId } : {};

  // Live Backend Queries
  const {
    data: summaryData,
    isLoading: loadingSummary,
    refetch: refetchSummary,
    isFetching: isFetchingSummary,
  } = useDashboardSummary(queryParams);

  const {
    data: todayAppointmentsData,
    isLoading: loadingToday,
    refetch: refetchToday,
    isFetching: isFetchingToday,
  } = useTodayAppointments(queryParams);

  const {
    data: upcomingAppointmentsData,
    isLoading: loadingUpcoming,
    refetch: refetchUpcoming,
    isFetching: isFetchingUpcoming,
  } = useUpcomingAppointments({ ...queryParams, limit: 15 });

  // Appointment Action Mutations
  const markArrivedMutation = useMarkAppointmentArrived({
    onSuccess: () => {
      toast.success("Patient marked as arrived");
      refetchToday();
      refetchSummary();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to mark patient as arrived");
    },
  });

  const markCompletedMutation = useMarkAppointmentCompleted({
    onSuccess: () => {
      toast.success("Consultation completed successfully");
      refetchToday();
      refetchSummary();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to complete consultation");
    },
  });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("today"); // "today" | "upcoming"

  // Selected or logged-in doctor display name
  const currentDoctorProfile = isAdmin
    ? doctorsList.find((d) => d._id === selectedDoctorId)
    : null;
  const doctorDisplayName = currentDoctorProfile?.user?.name || currentDoctorProfile?.name || user?.name || "Doctor";
  const doctorName = `Dr. ${doctorDisplayName.replace(/^Dr\.\s*/i, "")}`;

  // Parse API responses
  const summary = summaryData?.data?.summary || summaryData?.summary || {};
  const statusCounts = summaryData?.data?.appointmentCountsByStatus || summaryData?.appointmentCountsByStatus || {};
  const todayAppointments = todayAppointmentsData?.data?.appointments || todayAppointmentsData?.appointments || [];
  const upcomingAppointments = upcomingAppointmentsData?.data?.items || upcomingAppointmentsData?.items || [];

  // Real Stat computations
  const totalTodayAppointments = summary.todayAppointments ?? todayAppointments.length;
  const completedCount =
    summary.completedConsultations ??
    statusCounts.completed ??
    todayAppointments.filter((a) => a.status === "completed").length;
  const waitingCount =
    summary.patientsWaiting ??
    statusCounts.arrived ??
    todayAppointments.filter((a) => a.status === "arrived").length;
  const scheduledCount =
    statusCounts.scheduled ??
    todayAppointments.filter((a) => a.status === "scheduled").length;

  const handleRefreshAll = async () => {
    try {
      await Promise.all([refetchSummary(), refetchToday(), refetchUpcoming()]);
      toast.success("Doctor station refreshed");
    } catch {
      toast.error("Failed to refresh doctor dashboard");
    }
  };

  const handleStartConsultation = (app) => {
    setActiveSessionId(app._id);
    toast.success(`Started consultation session with ${app.patient?.name || "patient"}`);
  };

  const handleMarkArrived = (app) => {
    markArrivedMutation.mutate(app._id);
  };

  const handleCompleteConsultation = (app) => {
    markCompletedMutation.mutate(
      { id: app._id, notes: "Consultation finished on doctor dashboard" },
      {
        onSuccess: () => {
          setActiveSessionId(null);
        },
      }
    );
  };

  const isRefreshing = isFetchingSummary || isFetchingToday || isFetchingUpcoming;

  return (
    <div className="space-y-6">
      {/* Doctor Clinic Station Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border bg-gradient-to-r from-surface to-indigo-50/20 dark:to-indigo-950/20 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white text-xs">
              <FaUserMd />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Physician Consultation Station
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-text">
            Welcome, {doctorName}
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            You have {waitingCount} patients waiting and {scheduledCount} scheduled appointments today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Admin Doctor Switcher (If Admin is viewing this station) */}
          {isAdmin && doctorsList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs">
              <span className="text-muted font-medium">Physician:</span>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-transparent font-semibold text-text focus:outline-none cursor-pointer"
              >
                {doctorsList.map((doc) => (
                  <option key={doc._id} value={doc._id} className="bg-surface text-text">
                    Dr. {(doc.user?.name || doc.name || "Doctor").replace(/^Dr\.\s*/i, "")} ({doc.specialization || "General"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            leftIcon={<FiRefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />}
          >
            Refresh
          </Button>

          <Link href="/schedules">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiCalendar className="h-3.5 w-3.5" />}
            >
              Working Schedule
            </Button>
          </Link>

          <Link href="/patients">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiFileText className="h-3.5 w-3.5" />}
            >
              Patient Records
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards with live API metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Consultations"
          value={totalTodayAppointments}
          icon={<FiUser />}
          color="primary"
          change={totalTodayAppointments > 0 ? `${totalTodayAppointments} Booked today` : "No bookings today"}
          changeType="neutral"
          description="Total patient consultations"
          loading={loadingSummary || loadingToday}
        />

        <StatCard
          title="Patients Waiting"
          value={waitingCount}
          icon={<FiClock />}
          color="warning"
          change={waitingCount > 0 ? `${waitingCount} Ready in clinic` : "Lounge clear"}
          changeType={waitingCount > 0 ? "increase" : "neutral"}
          description="Arrived & checked-in"
          loading={loadingSummary}
        />

        <StatCard
          title="Completed Consultations"
          value={completedCount}
          icon={<FiCheckCircle />}
          color="success"
          change={
            totalTodayAppointments > 0
              ? `${Math.round((completedCount / totalTodayAppointments) * 100)}% finished`
              : "No appointments"
          }
          changeType="increase"
          description="Discharged today"
          loading={loadingSummary}
        />

        <StatCard
          title="Upcoming In Future"
          value={summary.upcomingAppointments ?? upcomingAppointments.length}
          icon={<FiActivity />}
          color="indigo"
          change="Scheduled next days"
          changeType="neutral"
          description="Future scheduled queue"
          loading={loadingSummary || loadingUpcoming}
        />
      </div>

      {/* Consultations Management Table: Tabbed (Today's Schedule / Upcoming Consultations) */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="font-display text-base font-semibold text-text">
              {activeTab === "today" ? "Today's Consultation Schedule" : "Upcoming Scheduled Consultations"}
            </h4>
            <p className="text-xs text-muted">
              {activeTab === "today"
                ? "Live patient arrivals, active sessions, and clinical outcomes"
                : "Future appointments booked for your medical schedule"}
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

            <Link href="/slots">
              <Button variant="ghost" size="sm" className="text-xs">
                View Slots
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab 1: Today's Consultation Schedule */}
        {activeTab === "today" && (
          loadingToday ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <FiRefreshCw className="h-6 w-6 text-primary animate-spin" />
              <p className="text-xs text-muted">Loading today&apos;s appointments...</p>
            </div>
          ) : todayAppointments.length === 0 ? (
            <EmptyState
              title="No consultations scheduled today"
              description="There are currently no patient consultations booked for your clinic shift today."
              actionLabel="Configure Schedule"
              onAction={() => {
                window.location.href = "/schedules";
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50/60 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Clinical Concern / Reason</th>
                    <th className="px-4 py-3">Slot Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Consultation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayAppointments.map((app) => {
                    const patientName = app.patient?.name || "Patient";
                    const patientAge = getPatientAge(app.patient);
                    const reason = app.purpose || app.notes || "General Consultation";
                    const time = formatAppointmentTime(app);
                    const isCurrentActive = activeSessionId === app._id;
                    const effectiveStatus = isCurrentActive ? "in_progress" : app.status;

                    return (
                      <tr
                        key={app._id}
                        className={cn(
                          "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",
                          isCurrentActive && "bg-indigo-50/40 dark:bg-indigo-950/30"
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
                              {patientName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text text-xs sm:text-sm truncate">
                                {patientName}
                              </p>
                              <p className="text-[11px] text-muted">
                                {patientAge ? `Age: ${patientAge}` : app.patient?.mobile || "Patient"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-xs sm:text-sm text-text font-medium">{reason}</p>
                          {app.department?.name && (
                            <p className="text-[11px] text-muted">{app.department.name}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-medium text-xs text-text">
                            <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                            {time}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={effectiveStatus} size="sm" />
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {effectiveStatus === "in_progress" ? (
                            <Button
                              variant="success"
                              size="xs"
                              onClick={() => handleCompleteConsultation(app)}
                              disabled={markCompletedMutation.isPending}
                              leftIcon={<FiCheckCircle className="h-3 w-3" />}
                            >
                              Complete Session
                            </Button>
                          ) : effectiveStatus === "arrived" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleStartConsultation(app)}
                                leftIcon={<FiPlay className="h-3 w-3" />}
                              >
                                Start Session
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleCompleteConsultation(app)}
                                disabled={markCompletedMutation.isPending}
                                leftIcon={<FiCheckCircle className="h-3 w-3" />}
                              >
                                Complete
                              </Button>
                            </div>
                          ) : effectiveStatus === "scheduled" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleMarkArrived(app)}
                                disabled={markArrivedMutation.isPending}
                                leftIcon={<FiUserCheck className="h-3 w-3" />}
                              >
                                Mark Arrived
                              </Button>
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleStartConsultation(app)}
                                leftIcon={<FiPlay className="h-3 w-3" />}
                              >
                                Start
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <FiCheckCircle className="h-3.5 w-3.5" /> Finished
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

        {/* Tab 2: Upcoming Consultations */}
        {activeTab === "upcoming" && (
          loadingUpcoming ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <FiRefreshCw className="h-6 w-6 text-primary animate-spin" />
              <p className="text-xs text-muted">Loading upcoming consultations...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming consultations"
              description="There are currently no future patient consultations booked on your schedule."
              actionLabel="Check Working Hours"
              onAction={() => {
                window.location.href = "/schedules";
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50/60 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Appointment Date</th>
                    <th className="px-4 py-3">Slot Time</th>
                    <th className="px-4 py-3">Clinical Concern</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {upcomingAppointments.map((app) => {
                    const patientName = app.patient?.name || "Patient";
                    const patientPhone = app.patient?.mobile || "No phone";
                    const reason = app.purpose || app.notes || "General Consultation";
                    const time = formatAppointmentTime(app);
                    const apptDate = app.appointmentDate ? formatDate(app.appointmentDate) : "Upcoming";

                    return (
                      <tr
                        key={app._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
                              {patientName.charAt(0)}
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
                          <p className="font-medium text-xs text-text">{apptDate}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-medium text-xs text-text">
                            <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                            {time}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-muted">
                          {reason}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} size="sm" />
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
