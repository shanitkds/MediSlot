"use client";

import React from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import { SlotSelector } from "./SlotSelector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function offsetDate(dateStr, days) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function SlotCalendar({
  selectedDate,
  onDateChange,
  slots = [],
  selectedSlotId,
  onSelectSlot,
  loading = false,
  className,
}) {
  const currentDate = selectedDate || new Date().toISOString().split("T")[0];

  const totalSlots = slots.length;
  const availableCount = slots.filter((s) => s.status === "available").length;
  const bookedCount = slots.filter((s) => s.status === "booked").length;

  const handlePrevDay = () => onDateChange?.(offsetDate(currentDate, -1));
  const handleNextDay = () => onDateChange?.(offsetDate(currentDate, 1));
  const handleToday = () => onDateChange?.(new Date().toISOString().split("T")[0]);

  const displayDateText = new Date(currentDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm space-y-5", className)}>
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FiCalendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-text">
              {displayDateText}
            </h4>
            <p className="text-xs text-muted">Select an available consultation slot</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="xs"
            onClick={handlePrevDay}
            aria-label="Previous day"
          >
            <FiChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleToday}
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleNextDay}
            aria-label="Next day"
          >
            <FiChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary Counts Bar */}
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="text-muted">Capacity Overview:</span>
        <Badge variant="outline" size="sm">
          {totalSlots} Total Slots
        </Badge>
        <Badge variant="success" size="sm" dot>
          {availableCount} Available
        </Badge>
        <Badge variant="primary" size="sm" dot>
          {bookedCount} Booked
        </Badge>
      </div>

      {/* Slots Selector Matrix */}
      <SlotSelector
        slots={slots}
        selectedSlotId={selectedSlotId}
        onSelect={onSelectSlot}
        loading={loading}
      />
    </div>
  );
}
