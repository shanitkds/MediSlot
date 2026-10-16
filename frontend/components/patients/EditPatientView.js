"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { usePatient, useUpdatePatient } from "@/hooks/queries/usePatientQuery";
import { useToast } from "@/contexts/ToastProvider";
import { FiSave } from "react-icons/fi";

export function EditPatientView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();

  const { data: patData, isLoading, error: fetchError, refetch } = usePatient(id);
  const patient = patData?.data?.patient || patData?.data || null;
  const updateMutation = useUpdatePatient();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patient) {
      setName(patient.name || "");
      setMobile(patient.mobile || "");
      setGender(patient.gender || "male");
      setDateOfBirth(
        patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split("T")[0] : ""
      );
      setBloodGroup(patient.bloodGroup || "");
      setAddress(patient.address || "");
    }
  }, [patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await updateMutation.mutateAsync({
        id,
        name: name.trim(),
        mobile: mobile.trim(),
        gender,
        dateOfBirth: dateOfBirth || undefined,
        bloodGroup: bloodGroup || undefined,
        address: address.trim() || undefined,
      });

      toast.success("Patient details updated successfully.");
      router.push(`/patients/${id}`);
    } catch (err) {
      setError(err?.message || "Failed to update patient details.");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin", "receptionist", "doctor"]}
      permission={PERMISSIONS.PATIENTS_UPDATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title={`Edit ${patient?.name || "Patient"}`}
          description="Update patient personal details, mobile contact, and address."
        />

        {isLoading ? (
          <LoadingState message="Loading patient chart..." fullPage={false} />
        ) : fetchError ? (
          <ErrorState error={fetchError} onRetry={refetch} />
        ) : patient ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="danger" title="Update Error" description={error} />}

              <Input
                label="Patient Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Mobile Contact"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />

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
                label="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => router.push(`/patients/${id}`)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={updateMutation.isPending} className="gap-2">
                  <FiSave className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center text-muted">Patient chart not found.</div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
