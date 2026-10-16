"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { DepartmentDeleteDialog } from "./DepartmentDeleteDialog";
import { useDepartment } from "@/hooks/queries/useDepartmentQuery";
import { useDoctors } from "@/hooks/queries/useDoctorQuery";
import { useAuth } from "@/contexts/AuthProvider";
import { formatDate } from "@/lib/utils";
import { FaUserMd } from "react-icons/fa";

export function DepartmentDetailView({ params, department: initialDepartment, onRefresh: initialOnRefresh }) {
  const router = useRouter();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.DEPARTMENTS_UPDATE);
  const canDelete = can(PERMISSIONS.DEPARTMENTS_DELETE);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Unwrap params if provided
  const unwrappedParams = params ? use(params) : null;
  const paramId = unwrappedParams?.id;

  const {
    data: deptData,
    isLoading: loadingDept,
    error: deptError,
    refetch,
  } = useDepartment(paramId, { enabled: Boolean(paramId) && !initialDepartment });

  const department =
    initialDepartment || deptData?.data?.department || deptData?.data || null;

  const deptId = department?.id || department?._id || paramId;

  // Fetch doctors assigned to this department
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors(
    { departmentId: deptId },
    { enabled: Boolean(deptId) }
  );

  const doctors =
    doctorsData?.data?.items || doctorsData?.data?.doctors || doctorsData?.data || [];

  if (loadingDept && !department) {
    return (
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />
        <LoadingState message="Loading department profile..." fullPage={false} />
      </PageContainer>
    );
  }

  if (deptError && !department) {
    return (
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />
        <ErrorState
          error={deptError}
          onRetry={refetch}
          title="Failed to load department details"
        />
      </PageContainer>
    );
  }

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.DEPARTMENTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <Breadcrumbs />

        {department ? (
          <div className="space-y-6">
            {/* Top Header Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 to-indigo-500/20 text-primary border border-primary/20">
                    <span className="text-2xl font-bold">🏥</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display text-2xl font-bold text-text">
                        {department?.name}
                      </h1>
                      <Badge
                        variant={department?.isActive ? "success" : "secondary"}
                        size="md"
                        className="font-semibold"
                      >
                        {department?.isActive ? "Active Unit" : "Inactive / Paused"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted">
                      Department ID: {deptId}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/departments")}
                    className="gap-1.5"
                  >
                    Back to List
                  </Button>

                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditOpen(true)}
                      className="gap-1.5 text-amber-500 hover:text-amber-600"
                    >
                      Edit
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                      className="gap-1.5 text-danger hover:text-rose-600"
                    >
                      Deactivate / Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* Description & Metadata Strip */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/80 pt-5 text-sm">
                <div className="md:col-span-2 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Scope of Care & Description
                  </span>
                  <p className="text-text leading-relaxed">
                    {department?.description ||
                      "No clinical description or service summary provided for this medical department."}
                  </p>
                </div>

                <div className="space-y-2 border-l border-border/60 pl-4 text-xs">
                  <div>
                    <span className="text-muted">Registered On:</span>
                    <p className="font-medium text-text">
                      {formatDate(department?.createdAt, { time: true })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Last Modified:</span>
                    <p className="font-medium text-text">
                      {formatDate(department?.updatedAt, { time: true })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Medical Doctors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-text">
                    Assigned Doctors & Specialists
                  </h2>
                  <p className="text-xs text-muted">
                    Healthcare professionals practicing in this department unit.
                  </p>
                </div>
                <Badge variant="outline" size="md">
                  {doctors.length} Doctor{doctors.length === 1 ? "" : "s"}
                </Badge>
              </div>

              {loadingDoctors ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
                  Loading assigned practitioners...
                </div>
              ) : doctors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
                  <FaUserMd className="mx-auto h-8 w-8 text-muted/60" />
                  <h3 className="mt-2 text-sm font-semibold text-text">
                    No doctors currently assigned
                  </h3>
                  <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                    Doctors can be allocated to this department through Doctor Management or their practitioner profile.
                  </p>
                  <div className="mt-4">
                    <Link href="/doctors">
                      <Button variant="outline" size="sm">
                        View Doctor Directory
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doc) => {
                    const docId = doc.id || doc._id;
                    const name = doc.user?.name || doc.name || "Doctor";
                    const email = doc.user?.email || doc.email || "";
                    const specialization = doc.specialization || "General Specialist";

                    return (
                      <div
                        key={docId}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-primary/40 transition-colors"
                      >
                        <Avatar name={name} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text truncate text-sm">
                            Dr. {name}
                          </p>
                          <p className="text-xs text-primary font-medium truncate">
                            {specialization}
                          </p>
                          {email && (
                            <p className="text-[11px] text-muted truncate">
                              {email}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Edit Modal */}
            <DepartmentFormModal
              open={editOpen}
              onClose={() => setEditOpen(false)}
              department={department}
              onSuccess={initialOnRefresh || refetch}
            />

            {/* Delete / Deactivate Dialog */}
            <DepartmentDeleteDialog
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              department={department}
              onSuccess={() => {
                router.push("/departments");
              }}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted">
            Department not found.
          </div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
