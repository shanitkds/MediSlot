"use client";

import React, { useState } from "react";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import { FiEye, FiClock, FiShield } from "react-icons/fi";
import { formatDate } from "@/lib/utils";

function getActionBadgeVariant(action) {
  switch (action?.toLowerCase()) {
    case "create":
      return "success";
    case "update":
    case "patch":
      return "warning";
    case "delete":
    case "deactivate":
      return "danger";
    case "login":
    case "refresh":
      return "info";
    default:
      return "default";
  }
}

function getRoleBadgeVariant(role) {
  switch (role?.toLowerCase()) {
    case "super admin":
    case "super_admin":
      return "primary";
    case "doctor":
      return "info";
    case "receptionist":
      return "success";
    case "admin":
      return "warning";
    default:
      return "secondary";
  }
}

export function AuditLogsTable({
  logs = [],
  loading = false,
  error = null,
  onRetry,
  pagination,
}) {
  const [activeLog, setActiveLog] = useState(null);

  const columns = [
    {
      key: "timestamp",
      label: "Timestamp",
      className: "w-48",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <FiClock className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-mono">{formatDate(row.timestamp || row.createdAt, { time: true })}</span>
        </div>
      ),
    },
    {
      key: "actor",
      label: "Actor / Identity",
      render: (row) => {
        const email = row.actorEmail || "System Event";
        const isSystem = !row.actorEmail && !row.userId;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={email} size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-text max-w-[200px]" title={email}>
                {email}
              </span>
              <span className="font-mono text-[10px] text-muted truncate max-w-[150px]">
                {row.userId || row.actorId ? `ID: ${row.userId || row.actorId}` : "Internal automated task"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      className: "w-32",
      render: (row) => (
        <Badge variant={getRoleBadgeVariant(row.role)} size="sm">
          {row.role || "System"}
        </Badge>
      ),
    },
    {
      key: "action",
      label: "Action",
      className: "w-28",
      render: (row) => (
        <Badge
          variant={getActionBadgeVariant(row.action)}
          size="sm"
          className="uppercase tracking-wider font-semibold text-[10px]"
        >
          {row.action || "EVENT"}
        </Badge>
      ),
    },
    {
      key: "module",
      label: "Module",
      className: "w-32",
      render: (row) => (
        <Badge variant="outline" size="sm" className="capitalize">
          {row.module || "General"}
        </Badge>
      ),
    },
    {
      key: "entity",
      label: "Target Resource",
      render: (row) => {
        if (!row.entity && !row.entityId) {
          return <span className="text-xs text-muted">—</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text">{row.entity || "Resource"}</span>
            {row.entityId && (
              <span
                className="font-mono text-[10px] text-muted truncate max-w-[140px]"
                title={row.entityId}
              >
                {row.entityId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Action",
      className: "w-24 text-right",
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLog(row);
            }}
            className="h-8 w-8 p-0 text-muted hover:text-primary"
            title="Inspect audit record"
          >
            <FiEye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onRowClick={(row) => setActiveLog(row)}
        emptyTitle="No audit log entries recorded"
        emptyMessage="Security and activity logs will appear here as users perform operations."
        emptyIcon={<FiShield className="h-8 w-8 text-muted" />}
        pagination={pagination}
      />

      {/* Detail Modal */}
      <AuditLogDetailModal
        open={Boolean(activeLog)}
        onClose={() => setActiveLog(null)}
        log={activeLog}
      />
    </>
  );
}
