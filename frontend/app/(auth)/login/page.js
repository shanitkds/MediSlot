import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
  description: "Sign in to MediSlot",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

