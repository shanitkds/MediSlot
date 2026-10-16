"use client";

import React from "react";
import { FiPlus, FiTrash2, FiCoffee, FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function formatTo12Hour(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export function BreakTimeEditor({
  breaks = [],
  onChange,
  disabled = false,
  label = "Break & Lunch Times",
  error,
  className,
}) {
  const handleTimeChange = (index, field, value) => {
    const updated = breaks.map((brk, idx) => {
      if (idx === index) {
        return {
          ...brk,
          [field]: value,
          startTime: field === "startTime" ? value : (brk.startTime ?? brk.start ?? ""),
          endTime: field === "endTime" ? value : (brk.endTime ?? brk.end ?? ""),
        };
      }
      return brk;
    });
    onChange?.(updated);
  };

  const addBreak = () => {
    onChange?.([...breaks, { startTime: "13:00", endTime: "14:00" }]);
  };

  const removeBreak = (index) => {
    const updated = breaks.filter((_, idx) => idx !== index);
    onChange?.(updated);
  };

  return (
    <div className={cn("space-y-3 text-left", className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-text select-none">
            {label}
          </label>
          <p className="text-[11px] text-muted">
            Breaks automatically deduct from the working shift (no appointment slots are generated during breaks)
          </p>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={addBreak}
            leftIcon={<FiPlus className="h-3.5 w-3.5" />}
          >
            Add Break
          </Button>
        )}
      </div>

      {breaks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
          No breaks configured. The doctor will be available continuously during sessions.
        </div>
      ) : (
        <div className="space-y-2.5">
          {breaks.map((brk, index) => {
            const startTimeVal = brk.startTime ?? brk.start ?? "";
            const endTimeVal = brk.endTime ?? brk.end ?? "";

            // Check if end time is earlier than start time (e.g. user typed 02:00 meaning 2 PM = 14:00)
            let pmSuggestion = null;
            if (startTimeVal && endTimeVal && endTimeVal <= startTimeVal) {
              const [h, m] = endTimeVal.split(":").map(Number);
              if (!isNaN(h) && h < 12) {
                const pmH = h + 12;
                const candidate = `${String(pmH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                if (candidate > startTimeVal) {
                  pmSuggestion = candidate;
                }
              }
            }

            return (
              <div
                key={index}
                className="rounded-lg border border-border bg-surface p-3 shadow-sm space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <FiCoffee className="h-4 w-4" />
                  </div>

                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="block text-[10px] uppercase font-semibold text-muted">
                          Break Start
                        </span>
                        {startTimeVal && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            {formatTo12Hour(startTimeVal)}
                          </span>
                        )}
                      </div>
                      <input
                        type="time"
                        disabled={disabled}
                        value={startTimeVal}
                        onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                        className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-xs text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer disabled:opacity-60"
                      />
                    </div>

                    <span className="text-xs text-muted font-medium pt-3.5">to</span>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="block text-[10px] uppercase font-semibold text-muted">
                          Break End
                        </span>
                        {endTimeVal && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            {formatTo12Hour(endTimeVal)}
                          </span>
                        )}
                      </div>
                      <input
                        type="time"
                        disabled={disabled}
                        value={endTimeVal}
                        onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                        className={cn(
                          "h-9 w-full rounded-md border bg-surface px-2.5 text-xs text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer disabled:opacity-60",
                          pmSuggestion ? "border-amber-400 bg-amber-50/20" : "border-border"
                        )}
                      />
                    </div>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeBreak(index)}
                      title="Remove break"
                      className="mt-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-slate-100 hover:text-danger dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {pmSuggestion && (
                  <div className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <FiAlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Break end is currently <strong>{formatTo12Hour(endTimeVal)}</strong>. Did you mean afternoon?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTimeChange(index, "endTime", pmSuggestion)}
                      className="inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      <span>Set {formatTo12Hour(pmSuggestion)} ({pmSuggestion})</span>
                      <FiArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
