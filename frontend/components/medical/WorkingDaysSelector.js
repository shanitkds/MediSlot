"use client";

import React from "react";
import { cn } from "@/lib/utils";

const daysOfWeek = [
  { dayNumber: 1, label: "Monday", short: "Mon" },
  { dayNumber: 2, label: "Tuesday", short: "Tue" },
  { dayNumber: 3, label: "Wednesday", short: "Wed" },
  { dayNumber: 4, label: "Thursday", short: "Thu" },
  { dayNumber: 5, label: "Friday", short: "Fri" },
  { dayNumber: 6, label: "Saturday", short: "Sat" },
  { dayNumber: 0, label: "Sunday", short: "Sun" },
];

export function WorkingDaysSelector({
  value = [1, 2, 3, 4, 5],
  onChange,
  disabled = false,
  label = "Working Days Schedule",
  error,
  className,
}) {
  const selectedDays = Array.isArray(value) ? value : [];

  const toggleDay = (dayNum) => {
    if (disabled) return;
    const isSelected = selectedDays.includes(dayNum);
    const updated = isSelected
      ? selectedDays.filter((d) => d !== dayNum)
      : [...selectedDays, dayNum].sort((a, b) => a - b);
    onChange?.(updated);
  };

  const applyPreset = (presetDays) => {
    if (disabled) return;
    onChange?.(presetDays);
  };

  return (
    <div className={cn("space-y-2 text-left", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-sm font-medium text-text select-none">
            {label}
          </label>
        )}

        {!disabled && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => applyPreset([1, 2, 3, 4, 5])}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Mon–Fri
            </button>
            <span className="text-muted">•</span>
            <button
              type="button"
              onClick={() => applyPreset([1, 2, 3, 4, 5, 6])}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Mon–Sat
            </button>
            <span className="text-muted">•</span>
            <button
              type="button"
              onClick={() => applyPreset([0, 1, 2, 3, 4, 5, 6])}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              All Days
            </button>
          </div>
        )}
      </div>

      {/* 7 Days Toggle Pills */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {daysOfWeek.map((day) => {
          const isSelected = selectedDays.includes(day.dayNumber);

          return (
            <button
              key={day.dayNumber}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(day.dayNumber)}
              title={day.label}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border py-2.5 sm:py-3 transition-all duration-150 cursor-pointer select-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary text-white shadow-sm font-semibold"
                  : "border-border bg-surface text-muted hover:border-slate-300 hover:text-text dark:hover:border-slate-700"
              )}
            >
              <span className="text-xs sm:text-sm font-bold">{day.short}</span>
              <span className="text-[10px] hidden sm:inline opacity-80">
                {isSelected ? "Active" : "Off"}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
