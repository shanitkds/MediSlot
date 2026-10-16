"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle } from "react-icons/fi";
import { useForgotPassword } from "@/hooks/queries/useAuthQuery";
import { useToast } from "@/contexts/ToastProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/common/FormError";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm({ className }) {
  const toast = useToast();
  const forgotPasswordMutation = useForgotPassword();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setSubmitted(true);
      toast.success("Password recovery instructions sent to your email.");
    } catch (err) {
      const msg = err?.message || err?.error?.message || "Failed to process password reset request.";
      setError(err?.error || msg);
      toast.error(msg);
    }
  };

  return (
    <div className={cn("w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl text-left", className)}>
      <div className="space-y-1 text-center mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-text">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Enter your email to receive recovery instructions
        </p>
      </div>

      <FormError error={error} onDismiss={() => setError(null)} />

      {submitted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-5 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400">
            <FiCheckCircle className="h-6 w-6" />
          </div>
          <h4 className="font-display text-base font-semibold text-emerald-950 dark:text-emerald-200">
            Check your inbox
          </h4>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            We have sent a password reset link to <strong className="font-semibold">{email}</strong>. Please follow the instructions in the email.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" size="sm" fullWidth leftIcon={<FiArrowLeft />}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Registered Email Address"
            type="email"
            required
            autoComplete="email"
            placeholder="doctor@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<FiMail className="h-4 w-4 text-muted" />}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={forgotPasswordMutation.isPending}
            leftIcon={<FiSend className="h-4 w-4" />}
            className="mt-2"
          >
            Send Recovery Link
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium transition-colors"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
