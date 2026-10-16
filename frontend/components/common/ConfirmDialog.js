"use client";

import React from "react";
import { ConfirmDialog as BaseConfirmDialog } from "@/components/ui/ConfirmDialog";

const presets = {
  delete: {
    title: "Delete Confirmation",
    description: "Are you sure you want to permanently delete this item? This action cannot be undone.",
    confirmLabel: "Delete Permanently",
    variant: "danger",
  },
  deactivate: {
    title: "Deactivate Confirmation",
    description: "Are you sure you want to deactivate this account? They will lose access immediately.",
    confirmLabel: "Deactivate",
    variant: "warning",
  },
  discard: {
    title: "Discard Changes",
    description: "You have unsaved changes. Are you sure you want to discard them?",
    confirmLabel: "Discard",
    variant: "warning",
  },
};

export function ConfirmDialog({
  open,
  preset,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant,
  loading = false,
  onConfirm,
  onClose,
  icon,
}) {
  const selectedPreset = preset && presets[preset] ? presets[preset] : {};

  return (
    <BaseConfirmDialog
      open={open}
      title={title || selectedPreset.title || "Confirm Action"}
      description={description || selectedPreset.description || "Are you sure you want to proceed?"}
      confirmLabel={confirmLabel || selectedPreset.confirmLabel || "Confirm"}
      cancelLabel={cancelLabel}
      variant={variant || selectedPreset.variant || "danger"}
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
      icon={icon}
    />
  );
}
