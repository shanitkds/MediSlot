"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/common/FormError";
import { FiSave, FiLayers } from "react-icons/fi";

export function DepartmentForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isActive, setIsActive] = useState(
    initialData?.isActive !== undefined ? initialData.isActive : true
  );
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
    }
  }, [initialData]);

  useEffect(() => {
    if (error?.fields && typeof error.fields === "object") {
      setFieldErrors((prev) => ({ ...prev, ...error.fields }));
    }
  }, [error]);

  const validate = () => {
    const errors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = "Department name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Department name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      errors.name = "Department name cannot exceed 100 characters.";
    }

    if (description && description.trim().length > 500) {
      errors.description = "Description cannot exceed 500 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit?.({
      name: name.trim(),
      description: description.trim(),
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && <FormError error={error} />}

      {/* Department Name */}
      <Input
        id="dept-name-input"
        label="Department Name"
        placeholder="e.g. Cardiology, Neurology, Pediatrics"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (fieldErrors.name) {
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }
        }}
        error={fieldErrors.name}
        required
        disabled={loading}
        leftIcon={<FiLayers className="h-4 w-4 text-muted" />}
        hint="Clinical division or medical specialty title (2 to 100 characters)."
      />

      {/* Description */}
      <Textarea
        id="dept-description-input"
        label="Description / Purpose"
        placeholder="Brief description of patient services, procedures, or specialization covered..."
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          if (fieldErrors.description) {
            setFieldErrors((prev) => ({ ...prev, description: undefined }));
          }
        }}
        error={fieldErrors.description}
        disabled={loading}
        rows={3}
        hint={`${description.length}/500 characters maximum.`}
      />

      {/* Active Operational Status */}
      <div className="rounded-lg border border-border bg-slate-50/50 p-4 dark:bg-slate-900/40">
        <Switch
          id="dept-active-switch"
          checked={isActive}
          onChange={(checked) => setIsActive(checked)}
          disabled={loading}
          label="Active Status"
          description="When active, doctors can be assigned to this department and appointments can be booked."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          id="dept-submit-btn"
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="gap-2"
        >
          <FiSave className="h-4 w-4" />
          {initialData ? "Update Department" : "Create Department"}
        </Button>
      </div>
    </form>
  );
}
