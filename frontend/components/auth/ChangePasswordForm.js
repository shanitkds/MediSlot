"use client";

import React, { useState } from "react";
import { FiLock, FiCheckCircle, FiShield } from "react-icons/fi";
import { useChangePassword } from "@/hooks/queries/useAuthQuery";
import { useToast } from "@/contexts/ToastProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/common/FormError";
import { cn } from "@/lib/utils";

export function ChangePasswordForm({ onSuccess, className }) {
  const toast = useToast();
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      toast.success("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      const msg = err?.message || err?.error?.message || "Failed to change password. Please verify your current password.";
      setError(err?.error || msg);
      toast.error(msg);
    }
  };

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-6 shadow-sm space-y-5 text-left", className)}>
      <div className="flex items-center gap-3 border-b border-border/80 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FiShield className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-text">
            Security & Change Password
          </h3>
          <p className="text-xs text-muted">
            Ensure your account is using a long, random password to stay secure
          </p>
        </div>
      </div>

      <FormError error={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <Input
          label="Current Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          leftIcon={<FiLock className="h-4 w-4 text-muted" />}
        />

        <Input
          label="New Password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="•••••••• (Min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          leftIcon={<FiLock className="h-4 w-4 text-muted" />}
        />

        <Input
          label="Confirm New Password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<FiLock className="h-4 w-4 text-muted" />}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={changePasswordMutation.isPending}
            leftIcon={<FiCheckCircle className="h-4 w-4" />}
          >
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
