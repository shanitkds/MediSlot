"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DepartmentForm } from "./DepartmentForm";
import { useCreateDepartment } from "@/hooks/queries/useDepartmentQuery";
import { useToast } from "@/contexts/ToastProvider";

export function CreateDepartmentView() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState(null);
  const createMutation = useCreateDepartment();

  const handleSubmit = async (formData) => {
    setError(null);
    try {
      await createMutation.mutateAsync(formData);
      toast.success(`Department "${formData.name}" created successfully.`);
      router.push("/departments");
    } catch (err) {
      setError(err?.message || "Failed to create department.");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.DEPARTMENTS_CREATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title="Create Medical Department"
          description="Register a new clinical department or medical specialty division."
        />

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <DepartmentForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/departments")}
            loading={createMutation.isPending}
            error={error}
          />
        </div>
      </PageContainer>
    </PermissionGate>
  );
}
