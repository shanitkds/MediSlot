"use client";

import React from "react";
import Link from "next/link";
import {
  FiUsers,
  FiLayers,
  FiUserCheck,
  FiPlus,
  FiClock,
  FiActivity,
  FiRefreshCw,
  FiCalendar,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import { useDashboardSummary } from "@/hooks/queries/useDashboardQuery";
import { useUsers } from "@/hooks/queries/useUserQuery";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useDepartments } from "@/hooks/queries/useDepartmentQuery";
import { usePatients } from "@/hooks/queries/usePatientQuery";
import { useSlots } from "@/hooks/queries/useSlotQuery";
import { useToast } from "@/contexts/ToastProvider";
import { StatCard } from "./StatCard";
import { DashboardChart } from "./DashboardChart";
import { RecentActivity } from "./RecentActivity";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function SuperAdminDashboard() {
  const toast = useToast();

  // Dashboard Summary API
  const {
    data: summaryData,
    isLoading: loadingSummary,
    refetch: refetchSummary,
    isFetching: isFetchingSummary,
  } = useDashboardSummary();

  // Module Queries
  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useUsers();
  const { data: doctorsData, isLoading: loadingDoctors, refetch: refetchDoctors } = useDoctors();
  const { data: deptData, isLoading: loadingDepts, refetch: refetchDepts } = useDepartments();
  const { data: patientsData, isLoading: loadingPatients, refetch: refetchPatients } = usePatients();
  const { data: slotsData, isLoading: loadingSlots, refetch: refetchSlots } = useSlots();

  const summary = summaryData?.data?.summary || summaryData?.summary || {};
  const statusCounts = summaryData?.data?.appointmentCountsByStatus || summaryData?.appointmentCountsByStatus || {};

  const totalUsers =
    usersData?.data?.pagination?.total ??
    usersData?.data?.total ??
    usersData?.data?.items?.length ??
    usersData?.data?.users?.length ??
    0;

  const totalDoctors =
    summary.totalDoctors ??
    doctorsData?.data?.pagination?.total ??
    doctorsData?.data?.total ??
    doctorsData?.data?.items?.length ??
    doctorsData?.data?.doctors?.length ??
    0;

  const totalDepartments =
    deptData?.data?.pagination?.total ??
    deptData?.data?.total ??
    deptData?.data?.items?.length ??
    deptData?.data?.departments?.length ??
    0;

  const totalPatients =
    summary.totalPatients ??
    patientsData?.data?.pagination?.total ??
    patientsData?.data?.total ??
    patientsData?.data?.items?.length ??
    patientsData?.data?.patients?.length ??
    0;

  const totalAppointments = summary.totalAppointments ?? 0;
  const todayAppointments = summary.todayAppointments ?? 0;

  const totalSlots =
    slotsData?.data?.pagination?.total ??
    slotsData?.data?.total ??
    slotsData?.data?.items?.length ??
    slotsData?.data?.slots?.length ??
    0;

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchSummary(),
        refetchUsers(),
        refetchDoctors(),
        refetchDepts(),
        refetchPatients(),
        refetchSlots(),
      ]);
      toast.success("Dashboard metrics refreshed successfully");
    } catch {
      toast.error("Failed to refresh some metrics");
    }
  };

  const isRefreshing = isFetchingSummary;

  // Real chart data directly mapped from live status counts
  const statusDistributionData = [
    { name: "Scheduled", appointments: statusCounts.scheduled || 0, completed: 0 },
    { name: "Arrived", appointments: statusCounts.arrived || 0, completed: 0 },
    {
      name: "Completed",
      appointments: statusCounts.completed || 0,
      completed: statusCounts.completed || 0,
    },
    { name: "Cancelled", appointments: statusCounts.cancelled || 0, completed: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border bg-gradient-to-r from-surface to-indigo-50/20 dark:to-indigo-950/20 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white text-xs">
              <FiActivity />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Hospital Master Admin
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-text">
            System Administration Overview
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            Monitor clinical resources, appointments ({todayAppointments} today / {totalAppointments} total), patient registration, and system audit trails.
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

          <Link href="/slots">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiClock className="h-3.5 w-3.5" />}
            >
              Slots ({totalSlots})
            </Button>
          </Link>

          <Link href="/doctors">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
            >
              Manage Doctors
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<FiUsers />}
          color="primary"
          change={totalUsers > 0 ? `${totalUsers} accounts` : "No users registered"}
          changeType="neutral"
          description="Hospital staff & admin"
          loading={loadingUsers}
        />

        <StatCard
          title="Active Doctors"
          value={totalDoctors}
          icon={<FaUserMd />}
          color="indigo"
          change={totalDoctors > 0 ? `${totalDoctors} practitioners` : "No doctors registered"}
          changeType="neutral"
          description="Across all departments"
          loading={loadingSummary || loadingDoctors}
        />

        <StatCard
          title="Departments"
          value={totalDepartments}
          icon={<FiLayers />}
          color="warning"
          change={totalDepartments > 0 ? `${totalDepartments} active units` : "None configured"}
          changeType="neutral"
          description="Operational departments"
          loading={loadingDepts}
        />

        <StatCard
          title="Registered Patients"
          value={totalPatients}
          icon={<FiUserCheck />}
          color="success"
          change={`${todayAppointments} today / ${totalAppointments} total`}
          changeType="increase"
          description="Registered patient records"
          loading={loadingSummary || loadingPatients}
        />
      </div>

      {/* Analytics Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardChart
            title="Live Appointment Status Breakdown"
            description="Live breakdown of hospital appointments across Scheduled, Arrived, Completed, and Cancelled statuses"
            data={statusDistributionData}
          />
        </div>

        <div className="lg:col-span-1">
          <RecentActivity limit={5} />
        </div>
      </div>
    </div>
  );
}
