"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs = [],
  value,
  onChange,
  variant = "line",
  className,
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap items-center gap-1",
        variant === "line" && "border-b border-border",
        variant === "pills" && "p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg inline-flex",
        variant === "enclosed" && "border-b border-border gap-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            disabled={tab.disabled}
            aria-selected={isActive}
            onClick={() => !tab.disabled && onChange?.(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium transition-all select-none cursor-pointer",
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Line variant
              variant === "line" && [
                "-mb-px border-b-2 px-4 py-2.5",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-slate-300 hover:text-text dark:hover:border-slate-700",
              ],
              // Pills variant
              variant === "pills" && [
                "px-3 py-1.5 rounded-md",
                isActive
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text",
              ],
              // Enclosed variant
              variant === "enclosed" && [
                "border border-b-0 rounded-t-lg px-4 py-2 -mb-px",
                isActive
                  ? "border-border bg-surface text-primary"
                  : "border-transparent bg-slate-50 dark:bg-slate-800/40 text-muted hover:text-text",
              ]
            )}
          >
            {tab.icon && <span className="h-4 w-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
