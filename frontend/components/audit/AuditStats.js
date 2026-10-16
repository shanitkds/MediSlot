"use client";

import React from "react";
import { FiActivity, FiShield, FiKey, FiDatabase } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function AuditStats({ items = [], total = 0, loading = false }) {
  // Derive category distributions from current dataset
  const authCount = items.filter(
    (item) => item.module === "auth" || item.action === "login" || item.action === "logout"
  ).length;

  const modificationCount = items.filter(
    (item) =>
      item.action === "create" ||
      item.action === "update" ||
      item.action === "delete" ||
      item.action === "patch"
  ).length;

  const securityCount = items.filter(
    (item) =>
      item.action === "delete" ||
      item.module === "permissions" ||
      item.module === "roles" ||
      item.role === "Super Admin"
  ).length;

  const stats = [
    {
      id: "stat-total-logs",
      label: "Total Audit Records",
      value: loading ? "—" : total.toLocaleString(),
      subtext: "Logged system events",
      icon: FiActivity,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      id: "stat-auth-events",
      label: "Auth & Sessions",
      value: loading ? "—" : authCount.toLocaleString(),
      subtext: "Logins & active sessions",
      icon: FiKey,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "stat-modifications",
      label: "Entity Operations",
      value: loading ? "—" : modificationCount.toLocaleString(),
      subtext: "Creates, updates & deletes",
      icon: FiDatabase,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "stat-security-events",
      label: "Privilege Actions",
      value: loading ? "—" : securityCount.toLocaleString(),
      subtext: "Super admin & role changes",
      icon: FiShield,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.id}
            id={s.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{s.subtext}</p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border",
                  s.bg,
                  s.color
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
