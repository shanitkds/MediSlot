"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export function Input({
  label,
  error,
  hint,
  id,
  type = "text",
  leftIcon,
  rightIcon,
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
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={cn(
            "h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted transition-colors",
            "outline-none ring-offset-bg",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:opacity-60 dark:disabled:bg-slate-800/50",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-muted">
            {rightIcon}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-muted">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-danger animate-fadeIn">{error}</p>
      )}
    </div>
  );
}
