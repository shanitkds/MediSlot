"use client";

import React from "react";
import { CreateDoctorUserView } from "@/components/users/CreateDoctorUserView";

export function CreateDoctorView() {
  return (
    <CreateDoctorUserView
      redirectPath="/doctors"
      backLabel="Back to Doctors"
      backHref="/doctors"
    />
  );
}
