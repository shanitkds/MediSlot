"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { DepartmentForm } from "./DepartmentForm";
import {
  useDepartment,
  useUpdateDepartment,
} from "@/hooks/queries/useDepartmentQuery";
import { useToast } from "@/contexts/ToastProvider";

export function EditDepartmentView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();

  const [formError, setFormError] = useState(null);
  const { data: deptData, isLoading, error, refetch } = useDepartment(id);
  const updateMutation = useUpdateDepartment();

  const department = deptData?.data?.department || deptData?.data || null;

  const handleSubmit = async (formData) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ id, ...formData });
      toast.success(`Department "${formData.name}" updated successfully.`);
      router.push(`/departments/${id}`);
    } catch (err) {
      setFormError(err?.message || "Failed to update department.");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.DEPARTMENTS_UPDATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title={`Edit ${department?.name || "Department"}`}
          description="Update department metadata, operational scope, and active status."
        />

        {isLoading ? (
          <LoadingState message="Loading department details..." fullPage={false} />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={refetch}
            title="Failed to load department"
          />
        ) : department ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <DepartmentForm
              initialData={department}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/departments/${id}`)}
              loading={updateMutation.isPending}
              error={formError}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted">
            Department not found.
          </div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
