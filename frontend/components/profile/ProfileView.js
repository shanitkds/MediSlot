"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthProvider";
import { useProfile, useUpdateProfile } from "@/hooks/queries/usePatientQuery";
import { useToast } from "@/contexts/ToastProvider";
import { formatDate } from "@/lib/utils";
import { FiUser, FiMail, FiShield, FiSave, FiLock, FiCalendar } from "react-icons/fi";

export function ProfileView() {
  const { user: authUser, refresh: refreshAuth } = useAuth();
  const toast = useToast();

  const { data: profileData, isLoading, error: fetchError, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const profile = profileData?.data?.user || profileData?.data || authUser;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      await updateMutation.mutateAsync({ name: name.trim() });
      toast.success("Profile updated successfully.");
      await refreshAuth();
      refetch();
    } catch (err) {
      setError(err?.message || "Failed to update profile.");
    }
  };

  const role = profile?.role || "User";

  return (
    <PageContainer maxWidth="compact" className="space-y-6">
      <Breadcrumbs />

      <PageHeader
        title="Personal Profile & Account"
        description="Manage your account identity, display name, and security preferences."
      />

      {/* Profile Overview Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.name || "User"} size="lg" className="h-16 w-16 text-lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-xl font-bold text-text">
                  {profile?.name || "User"}
                </h2>
                <Badge variant="primary" size="sm" className="capitalize">
                  {role.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted mt-1">{profile?.email}</p>
            </div>
          </div>

          <Link href="/settings/security">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FiLock className="h-3.5 w-3.5" />
              Security Settings
            </Button>
          </Link>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-6 border-t border-border/80 pt-5 space-y-4">
          {error && <Alert variant="danger" title="Profile Update Error" description={error} />}

          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<FiUser className="h-4 w-4 text-muted" />}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            disabled
            hint="Email address cannot be changed directly for security auditing reasons."
            leftIcon={<FiMail className="h-4 w-4 text-muted" />}
          />

          <div className="flex items-center justify-end pt-3">
            <Button type="submit" variant="primary" loading={updateMutation.isPending} className="gap-2">
              <FiSave className="h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
