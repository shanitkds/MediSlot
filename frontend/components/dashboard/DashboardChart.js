"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { FiBarChart2 } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function DashboardChart({
  title = "Appointments & Patient Flow",
  description = "Status breakdown of booked and completed consultations",
  data = [],
  chartType: initialChartType = "bar",
  height = 280,
  className,
}) {
  const [chartType, setChartType] = useState(initialChartType);

  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((d) => (d.appointments || 0) > 0 || (d.completed || 0) > 0);

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="font-display text-base font-semibold text-text">{title}</h4>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={cn(
              "rounded px-2.5 py-1 font-medium transition-colors cursor-pointer",
              chartType === "area"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            Area View
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={cn(
              "rounded px-2.5 py-1 font-medium transition-colors cursor-pointer",
              chartType === "bar"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            Bar View
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed border-border/70 bg-slate-50/50 dark:bg-slate-900/20"
        >
          <FiBarChart2 className="h-10 w-10 text-muted/40 mb-2" />
          <p className="text-sm font-semibold text-text">No appointment metrics recorded yet</p>
          <p className="text-xs text-muted max-w-sm mt-1">
            Real patient bookings, arrivals, and completed consultations will be charted here automatically.
          </p>
        </div>
      ) : (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(var(--color-surface))",
                    borderColor: "rgb(var(--color-border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAppointments)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(var(--color-surface))",
                    borderColor: "rgb(var(--color-border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="appointments" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 pt-1 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span>Total Appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Completed Consultations</span>
        </div>
      </div>
    </div>
  );
}
