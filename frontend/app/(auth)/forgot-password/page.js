import React from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your MediSlot account",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
