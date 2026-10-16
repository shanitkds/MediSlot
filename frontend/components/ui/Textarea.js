"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  label,
  error,
  hint,
  id,
  rows = 4,
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

      <textarea
        id={inputId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(
          "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted transition-colors",
          "outline-none ring-offset-bg resize-y min-h-[80px]",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:opacity-60 dark:disabled:bg-slate-800/50",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className
        )}
        {...props}
      />

      {hint && !error && (
        <p className="text-xs text-muted">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
