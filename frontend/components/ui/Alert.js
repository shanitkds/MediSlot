"use client";

import React, { useState } from "react";
import {
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const variantStyles = {
  info: {
    container: "border-indigo-200 bg-indigo-50/90 text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    container: "border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

const defaultIcons = {
  info: <FiInfo className="h-5 w-5" aria-hidden="true" />,
  success: <FiCheckCircle className="h-5 w-5" aria-hidden="true" />,
  warning: <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />,
  danger: <FiAlertCircle className="h-5 w-5" aria-hidden="true" />,
};

export function Alert({
  variant = "info",
  title,
  description,
  children,
  icon,
  dismissible = false,
  onDismiss,
  className,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const currentStyles = variantStyles[variant] || variantStyles.info;
  const currentIcon = icon !== undefined ? icon : defaultIcons[variant];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const renderDescription = () => {
    if (!description) return null;
    if (typeof description === "string") {
      return <div>{description}</div>;
    }
    if (typeof description === "object") {
      const msg = description.message || description.error;
      const fields = description.fields;
      return (
        <div className="space-y-1">
          {msg && <div>{msg}</div>}
          {fields && typeof fields === "object" && Object.keys(fields).length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90 mt-1">
              {Object.entries(fields).map(([k, v]) => (
                <li key={k}>
                  <strong className="font-semibold">{k}:</strong> {String(v)}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return <div>{String(description)}</div>;
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative flex w-full gap-3 rounded-lg border p-4 text-sm transition-all",
        currentStyles.container,
        className
      )}
    >
      {currentIcon && (
        <div className={cn("shrink-0", currentStyles.icon)}>
          {currentIcon}
        </div>
      )}

      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        {children && <div className="text-xs md:text-sm leading-relaxed">{children}</div>}
        {!children && renderDescription()}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="ml-auto -mr-1 -mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md opacity-70 hover:opacity-100 transition-opacity"
        >
          <FiX className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
