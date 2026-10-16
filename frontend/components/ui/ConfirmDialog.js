"use client";

import React from "react";
import { FiAlertCircle, FiAlertTriangle, FiInfo } from "react-icons/fi";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  title = "Confirm Action",
  description = "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onClose,
  icon,
  children,
}) {
  const defaultIcons = {
    danger: (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
        <FiAlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
    ),
    warning: (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
        <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
    ),
    primary: (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
        <FiInfo className="h-5 w-5" aria-hidden="true" />
      </div>
    ),
  };

  const dialogIcon = icon || defaultIcons[variant] || defaultIcons.danger;

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
    >
      <div className="flex items-start gap-4">
        {dialogIcon}
        <div className="space-y-1">
          <h3 className="font-display text-base font-semibold text-text leading-snug">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {children && <div className="mt-3">{children}</div>}

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={onClose}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// Backward-compatibility alias
export const ConfirmationDialog = ConfirmDialog;
