"use client";

import React, { useId } from "react";
import { FiChevronDown } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function Select({
  label,
  error,
  hint,
  id,
  children,
  options,
  placeholder,
  required,
  disabled,
  className,
  wrapperClassName,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || props.name || generatedId;

  return (
    <div className={cn("w-full space-y-1.5 text-left", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text select-none"
        >
          {label}
          {required && <span className="ml-1 text-danger font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          required={required}
          className={cn(
            "h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-9 text-sm text-text transition-colors cursor-pointer",
            "outline-none ring-offset-bg",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:opacity-60 dark:disabled:bg-slate-800/50",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          <FiChevronDown className="h-4 w-4" aria-hidden="true" />
        </div>
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
