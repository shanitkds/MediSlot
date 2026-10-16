"use client";

import React, { useId } from "react";
import { FiCalendar } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function DatePicker({
  label,
  error,
  hint,
  id,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className,
  wrapperClassName,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;

  return (
    <div className={cn("w-full space-y-1.5 text-left", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text select-none"
        >
          {label}
          {required && <span className="ml-1 text-danger font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted">
          <FiCalendar className="h-4 w-4" aria-hidden="true" />
        </div>

        <input
          id={inputId}
          type="date"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={cn(
            "h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text placeholder:text-muted transition-colors cursor-pointer",
            "outline-none ring-offset-bg",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:opacity-60 dark:disabled:bg-slate-800/50",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        />
      </div>

      {hint && !error && (
        <p className="text-xs text-muted">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
