"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import { useSignup } from "@/hooks/queries/useAuthQuery";
import { useToast } from "@/contexts/ToastProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/common/FormError";
import { cn } from "@/lib/utils";

export function SignupForm({ className }) {
  const router = useRouter();
  const toast = useToast();
  const signupMutation = useSignup();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("receptionist");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await signupMutation.mutateAsync({
        name,
        email,
        password,
        role,
      });

      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
    } catch (err) {
      const msg = err?.message || err?.error?.message || "Failed to create account.";
      setError(err?.error || msg);
      toast.error(msg);
    }
  };

  return (
    <div className={cn("w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl text-left", className)}>
      <div className="space-y-1 text-center mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-text">
          Create Account
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Register for MediSlot hospital scheduling system
        </p>
      </div>

      <FormError error={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          required
          placeholder="Dr. Jane Smith or Receptionist Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<FiUser className="h-4 w-4 text-muted" />}
        />

        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="name@hospital.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<FiMail className="h-4 w-4 text-muted" />}
        />

        <Select
          label="Primary Medical Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="receptionist">Receptionist / Front Desk</option>
          <option value="doctor">Medical Doctor / Consultant</option>
          <option value="patient">Patient / User</option>
        </Select>

        <Input
          label="Password"
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
          label="Confirm Password"
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
          loading={signupMutation.isPending}
          leftIcon={<FiUserPlus className="h-4 w-4" />}
          className="mt-2"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
}
