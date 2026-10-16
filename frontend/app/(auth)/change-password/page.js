import React from "react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata = {
  title: "Change Password",
  description: "Update your MediSlot account security credentials",
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
