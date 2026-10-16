"use client";

import React from "react";
import { usePatients } from "@/hooks/queries/usePatientQuery";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export function PatientSelect({
  value,
  onChange,
  label = "Select Patient",
  error,
  hint,
  placeholder = "Choose a registered patient...",
  required = false,
  disabled = false,
  className,
  ...props
}) {
  const { data, isLoading } = usePatients({ limit: 100 });
  const patients =
    data?.data?.items ||
    data?.data?.patients ||
    (Array.isArray(data?.data) ? data.data : []);

  const handleChange = (e) => {
    const selectedId = e.target.value;
    const selectedPatient = patients.find(
      (p) => (p.id || p._id || p.patientId) === selectedId
    );
    onChange?.(selectedId, selectedPatient, e);
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        label={label}
        value={value || ""}
        onChange={handleChange}
        error={error}
        hint={isLoading ? "Loading patient records..." : hint}
        required={required}
        disabled={disabled || isLoading}
        placeholder={placeholder}
        {...props}
      >
        <option value="" disabled>
          {isLoading ? "Loading patients..." : placeholder}
        </option>
        {patients.map((patient) => {
          const id = patient.id || patient._id || patient.patientId;
          return (
            <option key={id} value={id}>
              {patient.name} ({patient.patientId || "ID"} — {patient.mobile})
            </option>
          );
        })}
      </Select>
    </div>
  );
}
