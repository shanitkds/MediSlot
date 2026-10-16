"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

const trackSizes = {
  sm: "w-8 h-4",
  md: "w-11 h-6",
  lg: "w-14 h-7",
};

const thumbSizes = {
  sm: "h-3 w-3 translate-x-0.5 data-[state=checked]:translate-x-4",
  md: "h-5 w-5 translate-x-0.5 data-[state=checked]:translate-x-5",
  lg: "h-6 w-6 translate-x-0.5 data-[state=checked]:translate-x-7",
};

export function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  id,
  className,
  wrapperClassName,
  ...props
}) {
  const generatedId = useId();
  const switchId = id || props.name || generatedId;

  const handleClick = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(!checked, e);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (onChange) {
        onChange(!checked, e);
      }
    }
  };

  return (
    <div className={cn("inline-flex items-start gap-3 text-left", wrapperClassName)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700",
          trackSizes[size] || trackSizes.md,
          className
        )}
        {...props}
      >
        <span
          data-state={checked ? "checked" : "unchecked"}
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
            thumbSizes[size] || thumbSizes.md
          )}
        />
      </button>

      {(label || description) && (
        <div
          className="select-none cursor-pointer"
          onClick={handleClick}
        >
          {label && (
            <span
              className={cn(
                "block text-sm font-medium text-text",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-muted leading-relaxed">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
