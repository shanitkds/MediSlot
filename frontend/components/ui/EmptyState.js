import React from "react";
import { FiInbox } from "react-icons/fi";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title = "No data found",
  description,
  action,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted dark:bg-slate-800">
        {icon || <FiInbox className="h-6 w-6" aria-hidden="true" />}
      </div>

      <h3 className="mt-4 font-display text-base font-semibold text-text">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs md:text-sm text-muted">
          {description}
        </p>
      )}

      {action ? (
        <div className="mt-5">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
