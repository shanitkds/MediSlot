"use client";

import React, { use } from "react";
import { CreateDoctorUserView } from "@/components/users/CreateDoctorUserView";

export function EditDoctorView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  return (
    <CreateDoctorUserView
      doctorId={id}
      mode="edit"
      redirectPath={`/doctors/${id}`}
      backLabel="Back to Doctor Details"
      backHref={`/doctors/${id}`}
    />
  );
}
