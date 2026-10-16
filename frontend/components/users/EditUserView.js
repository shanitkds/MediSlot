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
import { useUser, useUpdateUser, useUpdateUserStatus } from "@/hooks/queries/useUserQuery";
import { useToast } from "@/contexts/ToastProvider";
import { FiSave } from "react-icons/fi";

export function EditUserView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();

  const { data: userData, isLoading, error: fetchError, refetch } = useUser(id);
  const user = userData?.data?.user || userData?.data || null;

  const updateMutation = useUpdateUser();
  const statusMutation = useUpdateUserStatus();

  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setRole(user.role || "member");
      setStatus(user.status || (user.isActive ? "active" : "disabled"));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await updateMutation.mutateAsync({
        id,
        name: name.trim(),
        role,
      });

      if (status !== user.status) {
        await statusMutation.mutateAsync({ id, status });
      }

      toast.success("User account updated successfully.");
      router.push(`/users/${id}`);
    } catch (err) {
      setError(err?.message || "Failed to update user account.");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.USERS_UPDATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title={`Edit ${user?.name || "User"}`}
          description="Update personnel account details, role permissions, and active status."
        />

        {isLoading ? (
          <LoadingState message="Loading user account..." fullPage={false} />
        ) : fetchError ? (
          <ErrorState error={fetchError} onRetry={refetch} />
        ) : user ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="danger" title="Update Error" description={error} />}

              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                value={user.email}
                disabled
                hint="User email address cannot be edited."
              />

              <Select
                label="Assigned System Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Administrator</option>
                <option value="super_admin">Super Administrator</option>
              </Select>

              <Select
                label="Account Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active (Access allowed)</option>
                <option value="disabled">Disabled (Access blocked)</option>
              </Select>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => router.push(`/users/${id}`)}>
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
          <div className="p-12 text-center text-muted">User not found.</div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
