import React from "react";
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const colorStyles = {
  primary: "text-primary bg-primary/10 dark:bg-primary/20",
  success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  danger: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400",
  indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400",
};

export function StatCard({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  description,
  loading = false,
  color = "primary",
  onClick,
  className,
}) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton variant="circular" className="h-10 w-10" />
        </div>
        <Skeleton className="h-8 w-28 rounded" />
        <Skeleton className="h-3 w-36 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {title}
        </p>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-transform",
              colorStyles[color] || colorStyles.primary
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
          {value ?? "0"}
        </h3>
      </div>

      {(change || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold",
                changeType === "increase" && "text-emerald-600 dark:text-emerald-400",
                changeType === "decrease" && "text-rose-600 dark:text-rose-400",
                changeType === "neutral" && "text-muted"
              )}
            >
              {changeType === "increase" && <FiTrendingUp className="h-3.5 w-3.5" />}
              {changeType === "decrease" && <FiTrendingDown className="h-3.5 w-3.5" />}
              {changeType === "neutral" && <FiMinus className="h-3.5 w-3.5" />}
              <span>{change}</span>
            </span>
          )}

          {description && (
            <span className="text-muted truncate">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
