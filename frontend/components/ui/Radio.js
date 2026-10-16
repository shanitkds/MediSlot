"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export function Radio({
  label,
  description,
  error,
  id,
  name,
  value,
  checked,
  onChange,
  disabled,
  className,
  wrapperClassName,
  ...props
}) {
  const generatedId = useId();
  const radioId = id || `${name}-${value}` || generatedId;

  return (
    <div className={cn("text-left", wrapperClassName)}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-5 items-center">
          <input
            id={radioId}
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              "h-4 w-4 border-border bg-surface text-primary transition",
              "focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 focus:ring-offset-bg",
              "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
              error && "border-danger",
              className
            )}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="text-sm select-none">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  "font-medium text-text cursor-pointer",
                  disabled && "cursor-not-allowed opacity-60"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted leading-relaxed">{description}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
