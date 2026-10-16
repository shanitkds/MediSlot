"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FiClock,
  FiUser,
  FiShield,
  FiLayers,
  FiCheck,
  FiCopy,
  FiCode,
} from "react-icons/fi";
import { formatDate } from "@/lib/utils";

function getActionVariant(action) {
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

export function AuditLogDetailModal({ open, onClose, log }) {
  const [copiedId, setCopiedId] = useState(false);

  if (!log) return null;

  const handleCopyId = () => {
    if (!log.id) return;
    navigator.clipboard.writeText(log.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const actionVariant = getActionVariant(log.action);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Audit Trail Record Details"
      description={`Record ID: ${log.id || "N/A"}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Highlight Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-slate-50/70 p-4 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Action:</span>
            <Badge variant={actionVariant} size="md" className="font-semibold uppercase tracking-wider">
              {log.action || "UNKNOWN"}
            </Badge>
            <span className="text-xs font-medium text-muted ml-2">Module:</span>
            <Badge variant="outline" size="md" className="capitalize">
              {log.module || "system"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <FiClock className="h-3.5 w-3.5 text-primary" />
            <span>{formatDate(log.timestamp || log.createdAt, { time: true })}</span>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Actor Info */}
          <div className="rounded-lg border border-border p-4 bg-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text">
              <FiUser className="h-4 w-4 text-primary" />
              <span>Actor Information</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Email / Identity:</span>
                <span className="font-medium text-text">{log.actorEmail || "System Automation"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">User ID:</span>
                <span className="font-mono text-text">{log.userId || log.actorId || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted">Role:</span>
                <Badge variant="secondary" size="sm">
                  {log.role || "N/A"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Resource & Entity */}
          <div className="rounded-lg border border-border p-4 bg-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text">
              <FiLayers className="h-4 w-4 text-primary" />
              <span>Target Resource</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Entity Type:</span>
                <span className="font-medium text-text">{log.entity || log.resourceType || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Entity ID:</span>
                <span className="font-mono text-text truncate max-w-[160px]" title={log.entityId}>
                  {log.entityId || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">System Module:</span>
                <span className="font-medium capitalize text-text">{log.module || "General"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Raw Record Inspector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <FiCode className="h-3.5 w-3.5 text-primary" />
              <span>Raw Event Payload</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyId}
              className="h-7 text-xs gap-1"
            >
              {copiedId ? <FiCheck className="h-3.5 w-3.5 text-emerald-500" /> : <FiCopy className="h-3.5 w-3.5" />}
              {copiedId ? "ID Copied" : "Copy Log ID"}
            </Button>
          </div>
          <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-slate-950 p-3.5 font-mono text-[11px] text-slate-200">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
