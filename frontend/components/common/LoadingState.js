import React from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  message = "Loading, please wait...",
  variant = "spinner",
  rows = 5,
  fullPage = false,
  className,
}) {
  if (variant === "skeleton") {
    return (
      <div className={cn("w-full space-y-3 p-4", className)}>
        <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
        <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
          <Skeleton className="h-6 w-1/3 rounded" />
          {Array.from({ length: rows }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4", className)}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="h-10 w-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center p-8",
        fullPage ? "min-h-[60vh]" : "py-16",
        className
      )}
    >
      <Spinner size="lg" variant="primary" />
      {message && (
        <p className="text-sm font-medium text-muted animate-pulse">{message}</p>
      )}
    </div>
  );
}
