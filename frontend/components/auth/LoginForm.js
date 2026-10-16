"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { useLogin } from "@/hooks/queries/useAuthQuery";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/common/FormError";
import {
  normalizeRole,
  getRoleDefaultRoute,
  canAccessRoute,
} from "@/constants/routes";
import { cn } from "@/lib/utils";

export function LoginForm({ className }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const { refresh, setUser } = useAuth();
  const toast = useToast();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      const loggedUser = response?.data?.user;
      let currentUser = loggedUser;
      if (loggedUser) {
        setUser(loggedUser);
      } else {
        currentUser = await refresh();
      }
      toast.success("Welcome back! Login successful.");

      // Role-based redirection logic
      const userRole = normalizeRole(currentUser);
      const isCustomNext = nextUrl && nextUrl !== "/dashboard" && nextUrl !== "/";
      const targetUrl =
        isCustomNext && canAccessRoute(nextUrl, currentUser)
          ? nextUrl
          : getRoleDefaultRoute(userRole);

      router.push(targetUrl);
    } catch (err) {
      const msg = err?.message || err?.error?.message || "Invalid email or password.";
      setError(err?.error || msg);
      toast.error(msg);
    }
  };

  return (
    <div className={cn("w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl text-left", className)}>
      <div className="space-y-1 text-center mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-text">
          Sign In to Medi<span className="text-primary">Slot</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Access your clinical portal, schedules, and patient records
        </p>
      </div>

      <FormError error={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="doctor@hospital.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<FiMail className="h-4 w-4 text-muted" />}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
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
        </div>

        <div className="flex items-center justify-between pt-1">
          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />

          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loginMutation.isPending}
          leftIcon={<FiLogIn className="h-4 w-4" />}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-muted">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
