import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className,
  style,
  ...props
}) {
  const variantClasses = {
    text: "h-4 w-full rounded",
    rectangular: "rounded-md",
    circular: "rounded-full shrink-0",
  };

  const customStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-slate-200/80 dark:bg-slate-700/60",
        variantClasses[variant] || variantClasses.rectangular,
        className
      )}
      style={customStyle}
      {...props}
    />
  );
}
