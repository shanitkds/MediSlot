"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeleteDepartment } from "@/hooks/queries/useDepartmentQuery";
import { useToast } from "@/contexts/ToastProvider";

export function DepartmentDeleteDialog({
  open,
  onClose,
  department,
  onSuccess,
}) {
  const toast = useToast();
  const deleteMutation = useDeleteDepartment();
  const [errorMessage, setErrorMessage] = useState(null);

  if (!department) return null;

  const id = department.id || department._id;
  const name = department.name || "this department";

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      const res = await deleteMutation.mutateAsync(id);
      const isDeleted = res?.data?.deleted;
      toast.success(
        isDeleted
          ? `Department "${name}" deleted permanently.`
          : `Department "${name}" deactivated successfully.`
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(
        err?.message || "Failed to remove or deactivate department."
      );
      toast.error(err?.message || "Operation failed.");
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        setErrorMessage(null);
        onClose();
      }}
      title={`Remove "${name}"?`}
      description={
        errorMessage
          ? errorMessage
          : `Are you sure you want to remove or deactivate "${name}"? If there are no doctors or past appointments, it will be deleted. Otherwise, it will be safely deactivated to preserve historical medical records.`
      }
      confirmLabel="Confirm Action"
      cancelLabel="Cancel"
      variant="danger"
      loading={deleteMutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
