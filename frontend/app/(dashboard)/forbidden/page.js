"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AccessDenied } from "@/components/permissions/AccessDenied";
import { getRouteRequiredAccess } from "@/constants/routes";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const required = from ? getRouteRequiredAccess(from) : null;

  return (
    <AccessDenied
      roles={required?.roles}
      permission={required?.permission}
      description={
        from
          ? `You do not possess the required clinical authorization or role to access "${from}".`
          : undefined
      }
    />
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Checking permissions...</div>}>
      <ForbiddenContent />
    </Suspense>
  );
}

