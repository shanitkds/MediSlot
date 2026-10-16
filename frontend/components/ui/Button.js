"use client";

import React from "react";
import { FiLoader } from "react-icons/fi";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-primary text-white hover:bg-primary/90 active:bg-primary/95 shadow-sm hover:shadow focus-visible:ring-primary/40",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm focus-visible:ring-slate-400",
  outline:
    "border border-border bg-surface text-text hover:bg-slate-100/70 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 focus-visible:ring-primary/30",
  ghost:
    "text-text hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200/60 dark:active:bg-slate-700/60 focus-visible:ring-primary/30",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/95 shadow-sm hover:shadow focus-visible:ring-danger/40",
  success:
    "bg-success text-white hover:bg-success/90 active:bg-success/95 shadow-sm hover:shadow focus-visible:ring-success/40",
  link:
    "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium focus-visible:ring-primary/30",
};

const sizeStyles = {
  xs: "h-7 px-2.5 text-xs rounded",
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-11 px-5 text-base rounded-md",
  xl: "h-12 px-6 text-base rounded-lg font-semibold",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none active:scale-[0.98]",
        variantStyles[variant] || variantStyles.primary,
        variant !== "link" && (sizeStyles[size] || sizeStyles.md),
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <FiLoader className="h-4 w-4 animate-spin text-current" aria-hidden="true" />
          <span>{typeof children === "string" ? "Please wait..." : children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
