"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useCreatePatient } from "@/hooks/queries/usePatientQuery";
import { useToast } from "@/contexts/ToastProvider";
import { FiSave, FiUserPlus } from "react-icons/fi";

export function CreatePatientView() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreatePatient();

  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !mobile.trim()) {
      setError("Patient name and mobile number are required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        patientId: patientId.trim() || undefined,
        mobile: mobile.trim(),
        gender,
        dateOfBirth: dateOfBirth || undefined,
        bloodGroup: bloodGroup || undefined,
        address: address.trim() || undefined,
      });

      toast.success(`Patient "${name}" registered successfully.`);
      router.push("/patients");
    } catch (err) {
      setError(err?.message || "Failed to register patient.");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin", "receptionist", "doctor"]}
      permission={PERMISSIONS.PATIENTS_CREATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title="Register New Patient"
          description="Create a medical record file and assign a unique Patient ID."
        />

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="danger" title="Registration Error" description={error} />}

            <Input
              label="Patient Full Name"
              placeholder="e.g. Robert Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Custom Patient ID (Optional)"
                placeholder="Auto-generated if blank (e.g. PT1002)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />

              <Input
                label="Mobile Contact"
                placeholder="e.g. +1 555-0199 or 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>

              <Input
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />

              <Select
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Unknown / None</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </div>

            <Input
              label="Residential Address (Optional)"
              placeholder="Street, City, Postal Code"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => router.push("/patients")}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createMutation.isPending} className="gap-2">
                <FiSave className="h-4 w-4" />
                Register Patient
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </PermissionGate>
  );
}
