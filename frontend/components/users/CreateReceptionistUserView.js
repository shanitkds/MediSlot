"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useCreateReceptionist } from "@/hooks/queries/useUserQuery";
import { useToast } from "@/contexts/ToastProvider";
import { FiSave } from "react-icons/fi";

export function CreateReceptionistUserView() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateReceptionist();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      toast.success(`Receptionist account for "${name}" created successfully.`);
      router.push("/users");
    } catch (err) {
      setError(err?.message || "Failed to create receptionist account.");
      if (err?.fields) {
        setFieldErrors(err.fields);
      }
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.USERS_CREATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title="Create Receptionist Account"
          description="Create front desk staff account with scheduling and appointment privileges."
        />

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="danger" title="Account Error" description={error} />}

            <Input
              label="Staff Full Name"
              placeholder="e.g. Johnathan Lee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="receptionist@hospital.org"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              error={fieldErrors.email}
              hint={fieldErrors.email ? undefined : "A unique work email address for login access."}
              required
            />

            <Input
              label="Initial Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => router.push("/users")}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createMutation.isPending} className="gap-2">
                <FiSave className="h-4 w-4" />
                Create Receptionist Account
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </PermissionGate>
  );
}
