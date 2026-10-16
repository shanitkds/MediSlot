"use client";

import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

const sideClasses = {
  left: "left-0 top-0 h-full w-full max-w-sm border-r",
  right: "right-0 top-0 h-full w-full max-w-sm border-l",
  top: "top-0 left-0 w-full max-h-[85vh] border-b",
  bottom: "bottom-0 left-0 w-full max-h-[85vh] border-t rounded-t-2xl",
};

export function Drawer({
  open,
  onClose,
  children,
  title,
  description,
  side = "right",
  className,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
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
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "fixed flex flex-col bg-surface text-text shadow-2xl border-border transition-all duration-300",
          sideClasses[side] || sideClasses.right,
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between border-b border-border/80 px-6 py-4">
            <div className="space-y-1">
              {title && (
                <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
              )}
              {description && (
                <p className="text-xs text-muted">{description}</p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="ml-auto -mr-2 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
