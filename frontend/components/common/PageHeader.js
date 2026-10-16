"use client";

import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  backHref,
  onBack,
  actions,
  className,
}) {
  return (
    <div className={cn("space-y-3 pb-2", className)}>
      {breadcrumbs && <div className="text-xs text-muted">{breadcrumbs}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          {(backHref || onBack) && (
            backHref ? (
              <Link
                href={backHref}
                className="mt-0.5 sm:mt-0 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors shadow-sm"
                aria-label="Go back"
              >
                <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 sm:mt-0 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                aria-label="Go back"
              >
                <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-text">
                {title}
              </h1>
              {badge && <div>{badge}</div>}
            </div>

            {description && (
              <p className="mt-1 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
