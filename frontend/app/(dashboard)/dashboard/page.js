"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { PageContainer } from "@/components/common/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { ReceptionistDashboard } from "@/components/dashboard/ReceptionistDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { normalizeRole } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useAppointmentSocket } from "@/hooks/useAppointmentSocket";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const userRole = normalizeRole(user);
  const [activeRoleView, setActiveRoleView] = useState(userRole);

  // Real-time appointment updates across all dashboard stations
  useAppointmentSocket();

  useEffect(() => {
    if (user) {
      setActiveRoleView(normalizeRole(user));
    }
  }, [user]);

  if (loading) {
    return <LoadingState message="Loading your dashboard..." fullPage />;
  }

  const isAdmin = userRole === "super_admin" || userRole === "admin";
  const effectiveRole = isAdmin ? activeRoleView : userRole;

  return (
    <PageContainer maxWidth="wide" className="space-y-4">
      {/* Admin Role Perspective Switcher (Visible to Admins to inspect other clinical views) */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 pb-3 gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 text-xs overflow-x-auto">
            <span className="text-[11px] font-semibold text-muted px-2 hidden sm:inline">
              Role View:
            </span>
            <button
              type="button"
              onClick={() => setActiveRoleView("super_admin")}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer shrink-0",
                effectiveRole === "super_admin" || effectiveRole === "admin"
                  ? "bg-surface text-text shadow-sm font-semibold"
                  : "text-muted hover:text-text"
              )}
            >
              Super Admin Station
            </button>
            <button
              type="button"
              onClick={() => setActiveRoleView("doctor")}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer shrink-0",
                effectiveRole === "doctor"
                  ? "bg-surface text-text shadow-sm font-semibold"
                  : "text-muted hover:text-text"
              )}
            >
              Doctor Station
            </button>
            <button
              type="button"
              onClick={() => setActiveRoleView("receptionist")}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer shrink-0",
                effectiveRole === "receptionist"
                  ? "bg-surface text-text shadow-sm font-semibold"
                  : "text-muted hover:text-text"
              )}
            >
              Receptionist Desk
            </button>
          </div>

          <span className="text-xs text-muted">
            Viewing Station: <strong className="font-semibold text-text capitalize">{effectiveRole.replace("_", " ")}</strong>
          </span>
        </div>
      )}

      {/* Role-Specific Dashboard Component */}
      {effectiveRole === "doctor" ? (
        <DoctorDashboard />
      ) : effectiveRole === "receptionist" ? (
        <ReceptionistDashboard />
      ) : (
        <SuperAdminDashboard />
      )}
    </PageContainer>
  );
}
