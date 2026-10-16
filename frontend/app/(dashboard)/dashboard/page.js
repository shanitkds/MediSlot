"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { PageContainer } from "@/components/common/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { ReceptionistDashboard } from "@/components/dashboard/ReceptionistDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { normalizeRole } from "@/constants/routes";
import { useAppointmentSocket } from "@/hooks/useAppointmentSocket";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const userRole = normalizeRole(user);

  // Real-time appointment updates across all dashboard stations
  useAppointmentSocket();

  if (loading) {
    return <LoadingState message="Loading your dashboard..." fullPage />;
  }

  return (
    <PageContainer maxWidth="wide" className="space-y-4">
      {/* Role-Specific Dashboard: each user only views their designated dashboard */}
      {userRole === "doctor" ? (
        <DoctorDashboard />
      ) : userRole === "receptionist" ? (
        <ReceptionistDashboard />
      ) : (
        <SuperAdminDashboard />
      )}
    </PageContainer>
  );
}
