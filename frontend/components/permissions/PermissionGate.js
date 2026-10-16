"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { AccessDenied } from "./AccessDenied";

export function PermissionGate({
  permission,
  roles,
  anyPermission = false,
  children,
  fallback,
}) {
  const { user, can } = useAuth();

  let hasAccess = true;

  // 1. Permission checks
  if (permission) {
    if (Array.isArray(permission)) {
      if (anyPermission) {
        hasAccess = permission.some((perm) => can(perm));
      } else {
        hasAccess = permission.every((perm) => can(perm));
      }
    } else {
      hasAccess = can(permission);
    }
  }

  // 2. Role checks
  if (roles && user) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    if (!requiredRoles.includes(user.role)) {
      hasAccess = false;
    }
  }

  // Granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback override or default AccessDenied screen
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return <AccessDenied permission={permission} roles={roles} />;
}
