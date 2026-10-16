"use client";

import React from "react";
import {
  FiCalendar,
  FiClock,
  FiCoffee,
  FiEdit2,
  FiCheckCircle,
} from "react-icons/fi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const weekDays = [
  { num: 1, name: "Monday", short: "Mon" },
  { num: 2, name: "Tuesday", short: "Tue" },
  { num: 3, name: "Wednesday", short: "Wed" },
  { num: 4, name: "Thursday", short: "Thu" },
  { num: 5, name: "Friday", short: "Fri" },
  { num: 6, name: "Saturday", short: "Sat" },
  { num: 0, name: "Sunday", short: "Sun" },
];

export function DoctorScheduleCalendar({
  schedule,
  onEdit,
  className,
}) {
  const workingDays = schedule?.workingDays || [1, 2, 3, 4, 5];
  const sessions = schedule?.sessions || [{ startTime: "09:00", endTime: "17:00" }];
  const breaks = schedule?.breaks || [{ startTime: "13:00", endTime: "14:00" }];
  const slotDuration = schedule?.slotDurationMinutes || 15;

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
            <FiCalendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-text">
              Doctor Schedule Overview
            </h4>
            <p className="text-xs text-muted">Weekly duty days, session intervals, and break configurations</p>
          </div>
        </div>

        {onEdit && (
          <Button
            variant="outline"
            size="xs"
            onClick={onEdit}
            leftIcon={<FiEdit2 />}
          >
            Configure
          </Button>
        )}
      </div>

      {/* Week Day Pills Grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Weekly Roster
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isWorking = workingDays.includes(day.num);

            return (
              <div
                key={day.num}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-colors",
                  isWorking
                    ? "border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200"
                    : "border-border bg-slate-50/50 dark:bg-slate-800/30 text-muted"
                )}
              >
                <span className="font-display font-bold text-sm">{day.short}</span>
                <span className="text-[10px] uppercase font-semibold mt-0.5">
                  {isWorking ? "On Duty" : "Off Day"}
                </span>
                {isWorking && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessions, Breaks, and Duration Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {/* Sessions */}
        <div className="rounded-lg border border-border bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-text">
            <FiClock className="h-3.5 w-3.5 text-primary" />
            <span>Clinical Sessions ({sessions.length})</span>
          </div>
          <div className="space-y-1">
            {sessions.map((sess, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-muted">
                <span>Session {idx + 1}</span>
                <span className="font-semibold text-text">{sess.startTime} — {sess.endTime}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breaks */}
        <div className="rounded-lg border border-border bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-text">
            <FiCoffee className="h-3.5 w-3.5 text-amber-500" />
            <span>Break Intervals ({breaks.length})</span>
          </div>
          <div className="space-y-1">
            {breaks.length === 0 ? (
              <p className="text-xs text-muted">No breaks defined</p>
            ) : (
              breaks.map((brk, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-muted">
                  <span>Break {idx + 1}</span>
                  <span className="font-semibold text-text">{brk.startTime} — {brk.endTime}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slot Duration */}
        <div className="rounded-lg border border-border bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-text">
            <FiCheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>Slot Duration</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted pt-1">
            <span>Per Patient</span>
            <Badge variant="primary" size="md">
              {slotDuration} Minutes
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
