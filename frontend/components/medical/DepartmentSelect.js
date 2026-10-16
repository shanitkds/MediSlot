"use client";

import React from "react";
import { useDepartments } from "@/hooks/queries/useDepartmentQuery";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export function DepartmentSelect({
  value,
  onChange,
  label = "Select Department",
  error,
  hint,
  placeholder = "Choose a clinical department...",
  required = false,
  disabled = false,
  className,
  ...props
}) {
  const { data, isLoading } = useDepartments({ limit: 100 });
  const departments = data?.data?.items || data?.data?.departments || [];

  const handleChange = (e) => {
    const selectedId = e.target.value;
    const selectedDept = departments.find(
      (d) => (d.id || d._id) === selectedId
    );
    onChange?.(selectedId, selectedDept, e);
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        label={label}
        value={value || ""}
        onChange={handleChange}
        error={error}
        hint={isLoading ? "Loading departments..." : hint}
        required={required}
        disabled={disabled || isLoading}
        placeholder={placeholder}
        {...props}
      >
        <option value="" disabled>
          {isLoading ? "Loading departments..." : placeholder}
        </option>
        {departments.map((dept) => {
          const id = dept.id || dept._id;
          const code = dept.code ? ` (${dept.code})` : "";
          return (
            <option key={id} value={id}>
              {dept.name}{code}
            </option>
          );
        })}
      </Select>
    </div>
  );
}
