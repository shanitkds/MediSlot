"use client";

import React from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

function getIsoDate(d) {
  return d.toISOString().split("T")[0];
}

const defaultPresets = [
  {
    label: "Today",
    getRange: () => {
      const today = getIsoDate(new Date());
      return { startDate: today, endDate: today };
    },
  },
  {
    label: "Last 7 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      return { startDate: getIsoDate(start), endDate: getIsoDate(end) };
    },
  },
  {
    label: "Last 30 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      return { startDate: getIsoDate(start), endDate: getIsoDate(end) };
    },
  },
  {
    label: "This Month",
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: getIsoDate(start), endDate: getIsoDate(end) };
    },
  },
];

export function DateRangePicker({
  startDate = "",
  endDate = "",
  onChange,
  label,
  error,
  showPresets = true,
  presets = defaultPresets,
  className,
}) {
  const handleStartChange = (e) => {
    onChange?.({ startDate: e.target.value, endDate });
  };

  const handleEndChange = (e) => {
    onChange?.({ startDate, endDate: e.target.value });
  };

  const handleClear = () => {
    onChange?.({ startDate: "", endDate: "" });
  };

  return (
    <div className={cn("space-y-2 text-left", className)}>
      {label && (
        <label className="block text-sm font-medium text-text select-none">
          {label}
        </label>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <input
            type="date"
            value={startDate}
            onChange={handleStartChange}
            aria-label="Start date"
            className={cn(
              "h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors cursor-pointer",
              "outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              error && "border-danger"
            )}
          />
        </div>

        <span className="text-xs text-muted font-medium select-none">to</span>

        <div className="relative flex-1 w-full">
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={handleEndChange}
            aria-label="End date"
            className={cn(
              "h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors cursor-pointer",
              "outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              error && "border-danger"
            )}
          />
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear date range"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showPresets && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {presets.map((preset) => {
            const range = preset.getRange();
            const isSelected = startDate === range.startDate && endDate === range.endDate;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange?.(range)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-surface text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
