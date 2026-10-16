import React from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password",
  description: "Reset your MediSlot account password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
