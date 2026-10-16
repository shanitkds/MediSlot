"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/queries/useUserQuery";
import { formatDate } from "@/lib/utils";
import { FiUser, FiMail, FiShield, FiEdit, FiClock } from "react-icons/fi";

export function UserDetailView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const { data: userData, isLoading, error, refetch } = useUser(id);
  const user = userData?.data?.user || userData?.data || null;

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.USERS_VIEW}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title={user?.name || "User Account"}
          description="Hospital personnel identity, assigned role permissions, and activity status."
        />

        {isLoading ? (
          <LoadingState message="Loading user account..." fullPage={false} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : user ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={user.name} size="lg" className="h-16 w-16 text-lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-text">
                      {user.name}
                    </h2>
                    <Badge variant="primary" size="sm" className="capitalize">
                      {user.role ? user.role.replace("_", " ") : "Member"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted mt-1">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/users")}>
                  Back to List
                </Button>
                <Link href={`/users/${id}/edit`}>
                  <Button variant="primary" size="sm" className="gap-1.5">
                    <FiEdit className="h-3.5 w-3.5" />
                    Edit User
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border/80 pt-5 text-xs">
              <div>
                <span className="text-muted block">Account Status</span>
                <p className="text-sm font-semibold text-text mt-0.5 capitalize">
                  {user.status || (user.isActive ? "active" : "inactive")}
                </p>
              </div>
              <div>
                <span className="text-muted block">Registered On</span>
                <p className="text-sm font-semibold text-text mt-0.5">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-muted">User not found.</div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
