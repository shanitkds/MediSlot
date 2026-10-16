import React from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default:
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-transparent",
  primary:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40",
  secondary:
    "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 border-transparent",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40",
  danger:
    "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40",
  outline:
    "border-border bg-transparent text-text hover:bg-slate-100 dark:hover:bg-slate-800",
};

const dotColors = {
  default: "bg-slate-400 dark:bg-slate-500",
  primary: "bg-indigo-500 dark:bg-indigo-400",
  secondary: "bg-slate-500 dark:bg-slate-400",
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
  outline: "bg-slate-400",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs font-medium",
  lg: "px-3 py-1 text-sm font-medium",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  removable = false,
  onRemove,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors select-none font-medium leading-none",
        badgeVariants[variant] || badgeVariants.default,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColors[variant] || dotColors.default
          )}
          aria-hidden="true"
        />
      )}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove badge"
          className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <FiX className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
