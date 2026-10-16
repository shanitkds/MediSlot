"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";
import { useResetPassword } from "@/hooks/queries/useAuthQuery";
import { useToast } from "@/contexts/ToastProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/common/FormError";
import { cn } from "@/lib/utils";

export function ResetPasswordForm({ token: propToken, className }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = propToken || searchParams.get("token") || "";

  const toast = useToast();
  const resetPasswordMutation = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing or has expired. Please request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password,
      });

      toast.success("Password reset successfully! Please sign in with your new password.");
      router.push("/login");
    } catch (err) {
      const msg = err?.message || err?.error?.message || "Failed to reset password.";
      setError(err?.error || msg);
      toast.error(msg);
    }
  };

  return (
    <div className={cn("w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl text-left", className)}>
      <div className="space-y-1 text-center mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-text">
          Set New Password
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Create a secure password for your account
        </p>
      </div>

      <FormError error={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type={showPassword ? "text" : "password"}
          required
          placeholder="•••••••• (Min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<FiLock className="h-4 w-4 text-muted" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-muted hover:text-text transition-colors cursor-pointer"
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          }
        />

        <Input
          label="Confirm New Password"
          type={showPassword ? "text" : "password"}
          required
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<FiLock className="h-4 w-4 text-muted" />}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={resetPasswordMutation.isPending}
          leftIcon={<FiCheckCircle className="h-4 w-4" />}
          className="mt-2"
        >
          Update Password
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-muted">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
