import React from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const variantStyles = {
  default: "border-border bg-surface text-text",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200",
  danger:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200",
  info:
    "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-200",
};

const toastIcons = {
  success: (
    <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
  ),
  danger: (
    <FiAlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
  ),
  warning: (
    <FiAlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
  ),
  info: (
    <FiInfo className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
  ),
};

export function Toast({
  children,
  title,
  variant = "default",
  onClose,
  className,
}) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-fadeIn",
        variantStyles[variant] || variantStyles.default,
        className
      )}
    >
      {toastIcons[variant]}

      <div className="flex-1 space-y-0.5">
        {title && <p className="text-sm font-semibold leading-tight">{title}</p>}
        <div className="text-xs md:text-sm leading-relaxed opacity-90">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="ml-auto -mr-1 -mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md opacity-60 hover:opacity-100 transition-opacity"
        >
          <FiX className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
