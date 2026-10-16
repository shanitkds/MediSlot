"use client";

import React from "react";
import Link from "next/link";
import { FiLock, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/Button";

export function PermissionGate({
  permission,
  roles,
  children,
  fallback,
}) {
  const { user, can } = useAuth();

  let hasAccess = true;

  if (permission && !can(permission)) {
    hasAccess = false;
  }

  if (roles && user) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    if (!requiredRoles.includes(user.role)) {
      hasAccess = false;
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center shadow-sm max-w-lg mx-auto my-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
        <FiLock className="h-7 w-7" />
      </div>

      <h2 className="mt-4 font-display text-lg font-bold text-text">
        Access Restricted
      </h2>

      <p className="mt-2 text-sm text-muted leading-relaxed">
        You do not have the required permissions ({permission || (Array.isArray(roles) ? roles.join(", ") : roles)}) to access this section.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" leftIcon={<FiArrowLeft />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
