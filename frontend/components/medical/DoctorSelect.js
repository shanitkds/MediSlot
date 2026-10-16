"use client";

import React from "react";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export function DoctorSelect({
  value,
  onChange,
  departmentId,
  label = "Select Doctor",
  error,
  hint,
  placeholder = "Choose a doctor...",
  required = false,
  disabled = false,
  className,
  ...props
}) {
  const { data, isLoading } = useDoctors({
    limit: 100,
    status: "active",
    ...(departmentId ? { departmentId } : {}),
  });

  const doctors =
    data?.data?.items ||
    data?.data?.doctors ||
    (Array.isArray(data?.data) ? data.data : []);

  const handleChange = (e) => {
    const selectedId = e.target.value;
    const selectedDoctor = doctors.find(
      (d) => (d.id || d._id) === selectedId
    );
    onChange?.(selectedId, selectedDoctor, e);
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        label={label}
        value={value || ""}
        onChange={handleChange}
        error={error}
        hint={isLoading ? "Loading doctors..." : hint}
        required={required}
        disabled={disabled || isLoading}
        placeholder={placeholder}
        {...props}
      >
        <option value="" disabled>
          {isLoading ? "Loading doctors..." : placeholder}
        </option>
        {doctors.map((doctor) => {
          const id = doctor.id || doctor._id;
          const name = doctor.userId?.name || doctor.name || "Doctor";
          const spec = doctor.specialization ? ` (${doctor.specialization})` : "";
          return (
            <option key={id} value={id}>
              Dr. {name.replace(/^Dr\.\s*/i, "")}{spec}
            </option>
          );
        })}
      </Select>
    </div>
  );
}
