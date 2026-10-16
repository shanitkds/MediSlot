"use client";

import React from "react";
import { FiLayers, FiCheckCircle, FiMinusCircle, FiUsers } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function DepartmentStats({
  departments = [],
  total = 0,
  loading = false,
  doctorsCount = null,
}) {
  const activeCount = departments.filter((d) => d.isActive).length;
  const inactiveCount = departments.filter((d) => !d.isActive).length;

  const stats = [
    {
      id: "stat-total-departments",
      label: "Total Departments",
      value: loading ? "—" : total.toLocaleString(),
      subtext: "Clinical units & specialties",
      icon: FiLayers,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      id: "stat-active-departments",
      label: "Active Clinical Units",
      value: loading ? "—" : activeCount.toLocaleString(),
      subtext: "Operational & booking enabled",
      icon: FiCheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "stat-inactive-departments",
      label: "Inactive / Archived",
      value: loading ? "—" : inactiveCount.toLocaleString(),
      subtext: "Temporarily offline or paused",
      icon: FiMinusCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "stat-assigned-doctors",
      label: "Staffed Medical Teams",
      value: loading ? "—" : (doctorsCount !== null ? doctorsCount.toLocaleString() : "Active"),
      subtext: "Practitioner associations",
      icon: FiUsers,
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
