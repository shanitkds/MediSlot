"use client";

import React from "react";
import {
  FiActivity,
  FiUserPlus,
  FiCalendar,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiEdit3,
} from "react-icons/fi";
import { useAuditLogs } from "@/hooks/queries/useAuditQuery";
import { useToast } from "@/contexts/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const actionIcons = {
  USER_CREATE: <FiUserPlus className="text-primary" />,
  DOCTOR_CREATE: <FiUserPlus className="text-indigo-500" />,
  PATIENT_CREATE: <FiUserPlus className="text-emerald-500" />,
  SLOT_GENERATE: <FiCalendar className="text-amber-500" />,
  SLOT_BOOK: <FiCalendar className="text-indigo-500" />,
  SLOT_UPDATE: <FiEdit3 className="text-primary" />,
  LOGIN: <FiShield className="text-emerald-500" />,
  LOGOUT: <FiShield className="text-muted" />,
  DEFAULT: <FiActivity className="text-primary" />,
};

function formatAuditDescription(log) {
  if (log.description) return log.description;
  const action = (log.action || "").toUpperCase();
  const entity = log.entity ? `on ${log.entity}` : "";
  switch (action) {
    case "USER_CREATE":
      return `Created new user account ${entity}`.trim();
    case "USER_UPDATE":
      return `Updated user record ${entity}`.trim();
    case "DOCTOR_CREATE":
      return `Created doctor profile ${entity}`.trim();
    case "DOCTOR_UPDATE":
      return `Updated doctor details ${entity}`.trim();
    case "PATIENT_CREATE":
      return `Registered new patient ${entity}`.trim();
    case "PATIENT_UPDATE":
      return `Updated patient record ${entity}`.trim();
    case "SLOT_GENERATE":
      return `Generated schedule slots ${entity}`.trim();
    case "APPOINTMENT_CREATE":
      return `Booked patient appointment ${entity}`.trim();
    case "APPOINTMENT_ARRIVE":
      return `Checked in patient arrival ${entity}`.trim();
    case "APPOINTMENT_COMPLETE":
      return `Completed consultation ${entity}`.trim();
    case "AUTH_LOGIN":
      return `User logged into system`;
    case "AUTH_LOGOUT":
      return `User logged out`;
    default:
      return `${(log.action || "System action").replace(/_/g, " ")} ${entity}`.trim();
  }
}

export function RecentActivity({ limit = 5, className }) {
  const toast = useToast();
  const { data, isLoading, refetch, isFetching } = useAuditLogs({ limit });

  const auditLogs = data?.data?.items || data?.data?.logs || data?.items || [];

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Activity logs updated");
    } catch {
      toast.error("Failed to refresh activity logs");
    }
  };

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-base font-semibold text-text">Recent Activity</h4>
          <p className="text-xs text-muted">Latest live system audit events recorded</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching || isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          title="Refresh activities"
        >
          <FiRefreshCw className={cn("h-3.5 w-3.5", (isFetching || isLoading) && "animate-spin")} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <FiRefreshCw className="h-5 w-5 text-primary animate-spin" />
          <p className="text-xs text-muted">Loading audit trails...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center p-4 rounded-lg border border-dashed border-border/70 bg-slate-50/50 dark:bg-slate-900/20">
          <FiActivity className="h-8 w-8 text-muted/40 mb-2" />
          <p className="text-xs font-semibold text-text">No recent activity recorded</p>
          <p className="text-[11px] text-muted max-w-xs mt-0.5">
            Audit trails for appointments, patients, and staff operations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {auditLogs.slice(0, limit).map((log) => {
            const actionKey = log.action || "DEFAULT";
            const icon = actionIcons[actionKey] || actionIcons.DEFAULT;
            const logId = log.id || log._id || `${log.action}-${log.createdAt}`;
            const actorDisplay = log.actorEmail || log.actor || log.userEmail || log.role || "System";

            return (
              <div key={logId} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  {icon}
                </div>

                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-text truncate">
                      {formatAuditDescription(log)}
                    </p>
                    <span className="text-[10px] text-muted shrink-0">
                      {formatDate(log.createdAt || log.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span>
                      By <strong className="font-medium text-text">{actorDisplay}</strong>
                    </span>
                    <span>•</span>
                    <Badge variant="outline" size="sm" className="text-[9px] py-0 px-1.5 uppercase">
                      {log.action?.split("_")[0] || "LOG"}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
