"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { authService } from "@/services/authService";
import { useToast } from "@/contexts/ToastProvider";
import { FiLock, FiShield, FiKey } from "react-icons/fi";

export function SecuritySettingsView() {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully.");
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="compact" className="space-y-6">
      <Breadcrumbs />

      <PageHeader
        title="Security & Password Settings"
        description="Update your credentials and manage authentication access protection."
      />

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border/80 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FiKey className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-text">
              Change Account Password
            </h2>
            <p className="text-xs text-muted">
              Choose a strong passphrase to maintain clinical data security.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="danger" title="Security Alert" description={error} />}
          {success && (
            <Alert
              variant="success"
              title="Success"
              description="Your account password was updated successfully."
            />
          )}

          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            leftIcon={<FiLock className="h-4 w-4 text-muted" />}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            leftIcon={<FiShield className="h-4 w-4 text-muted" />}
            hint="Must include uppercase, lowercase, numbers, and special characters."
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            leftIcon={<FiShield className="h-4 w-4 text-muted" />}
          />

          <div className="flex items-center justify-end pt-3 border-t border-border">
            <Button type="submit" variant="primary" loading={loading} className="gap-2">
              <FiShield className="h-4 w-4" />
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
