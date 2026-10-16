"use client";

import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
}) {
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-xl border border-border bg-surface text-text shadow-2xl transition-all animate-scaleUp",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between border-b border-border/70 px-6 py-4">
            <div className="space-y-1">
              {title && (
                <h2 className="font-display text-lg font-semibold leading-tight text-text">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs md:text-sm text-muted">{description}</p>
              )}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-auto -mr-2 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-slate-50/50 dark:bg-slate-800/40 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
