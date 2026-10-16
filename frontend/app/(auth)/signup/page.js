import React from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Register",
  description: "Create an account on MediSlot",
};

export default function SignupPage() {
  return <SignupForm />;
}
