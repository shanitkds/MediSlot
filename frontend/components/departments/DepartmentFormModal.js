"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DepartmentForm } from "./DepartmentForm";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/queries/useDepartmentQuery";
import { useToast } from "@/contexts/ToastProvider";

export function DepartmentFormModal({
  open,
  onClose,
  department = null, // if provided, editing; if null, creating
  onSuccess,
}) {
  const toast = useToast();
  const [error, setError] = useState(null);

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const isEditing = Boolean(department?.id || department?._id);
  const loading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (formData) => {
    setError(null);
    try {
      if (isEditing) {
        const id = department.id || department._id;
        await updateMutation.mutateAsync({ id, ...formData });
        toast.success(`Department "${formData.name}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(`Department "${formData.name}" created successfully.`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save department.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={isEditing ? "Edit Department" : "Create New Department"}
      description={
        isEditing
          ? "Update department title, service description, or active status."
          : "Add a clinical unit or medical specialty to hospital operations."
      }
      size="md"
    >
      <DepartmentForm
        initialData={department}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
        error={error}
      />
    </Modal>
  );
}
