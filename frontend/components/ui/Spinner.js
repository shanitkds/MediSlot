import React from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-3.5 w-3.5 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
  xl: "h-12 w-12 border-4",
};

const variantClasses = {
  primary: "border-border border-t-primary",
  current: "border-current/20 border-t-current",
  white: "border-white/20 border-t-white",
  muted: "border-border border-t-muted",
};

export function Spinner({
  size = "md",
  variant = "primary",
  label = "Loading...",
  className,
  showLabel = false,
}) {
  return (
    <div
      role="status"
      className={cn("inline-flex items-center justify-center gap-2 text-sm text-muted", className)}
    >
      <span
        className={cn(
          "inline-block animate-spin rounded-full",
          sizeClasses[size] || sizeClasses.md,
          variantClasses[variant] || variantClasses.primary
        )}
      />
      {showLabel && <span>{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
