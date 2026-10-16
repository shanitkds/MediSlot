"use client";

import React from "react";
import { FiSun, FiSunset, FiMoon, FiCheck, FiClock } from "react-icons/fi";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function getPeriod(dateStr) {
  const d = new Date(dateStr);
  const hour = d.getUTCHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function SlotSelector({
  slots = [],
  selectedSlotId,
  onSelect,
  loading = false,
  className,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-xs text-muted">
        <Spinner size="md" />
        <span>Loading available slots...</span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted space-y-1">
        <FiClock className="mx-auto h-6 w-6 text-muted mb-2 opacity-60" />
        <p className="font-semibold text-text">No slots found for this date</p>
        <p>Please select another day or generate new slots for this doctor schedule.</p>
      </div>
    );
  }

  const morningSlots = slots.filter((s) => getPeriod(s.startAt) === "morning");
  const afternoonSlots = slots.filter((s) => getPeriod(s.startAt) === "afternoon");
  const eveningSlots = slots.filter((s) => getPeriod(s.startAt) === "evening");

  const renderSlotGroup = (title, icon, items) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
          {icon}
          <span>{title} ({items.length})</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {items.map((slot) => {
            const slotId = slot.id || slot._id;
            const isSelected = selectedSlotId === slotId;
            const isBooked = slot.status === "booked";
            const isPast = slot.startAt && new Date(slot.startAt) <= new Date();
            const isDisabled = isBooked || isPast;

            return (
              <button
                key={slotId}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelect?.(slot)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs transition-all duration-150 cursor-pointer select-none",
                  "disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-slate-100 dark:disabled:bg-slate-800/40",
                  isSelected
                    ? "border-primary bg-primary text-white shadow-md font-bold scale-[1.02]"
                    : isBooked
                    ? "border-border bg-slate-50 dark:bg-slate-800/40 text-muted line-through"
                    : isPast
                    ? "border-border bg-slate-100/70 dark:bg-slate-800/20 text-muted/60"
                    : "border-border bg-surface text-text hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <span className="font-semibold">{formatTime(slot.startAt)}</span>
                <span className="text-[10px] opacity-80">
                  {isBooked ? "Booked" : isPast ? "Past" : "Open"}
                </span>

                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <FiCheck className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6 text-left", className)}>
      {renderSlotGroup("Morning Session", <FiSun className="text-amber-500" />, morningSlots)}
      {renderSlotGroup("Afternoon Session", <FiSunset className="text-orange-500" />, afternoonSlots)}
      {renderSlotGroup("Evening Session", <FiMoon className="text-indigo-400" />, eveningSlots)}
    </div>
  );
}
