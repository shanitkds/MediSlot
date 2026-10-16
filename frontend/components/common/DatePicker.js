"use client";

import React from "react";
import { DatePicker as BaseDatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

function getFormattedDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  hint,
  showPresets = false,
  presets = [
    { label: "Today", value: getFormattedDate(0) },
    { label: "Tomorrow", value: getFormattedDate(1) },
    { label: "In 7 Days", value: getFormattedDate(7) },
  ],
  className,
  wrapperClassName,
  ...props
}) {
  const handlePreset = (presetVal) => {
    onChange?.({ target: { value: presetVal } });
  };

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <BaseDatePicker
        value={value}
        onChange={onChange}
        label={label}
        error={error}
        hint={hint}
        className={className}
        {...props}
      />

      {showPresets && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(preset.value)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer",
                value === preset.value
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-surface text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
