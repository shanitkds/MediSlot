"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { DepartmentDeleteDialog } from "./DepartmentDeleteDialog";
import { useAuth } from "@/contexts/AuthProvider";
import { PERMISSIONS } from "@/constants/permissions";
import { formatDate } from "@/lib/utils";
import {
  FiLayers,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export function DepartmentTable({
  departments = [],
  loading = false,
  error = null,
  onRetry,
  pagination,
  onRefresh,
}) {
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.DEPARTMENTS_UPDATE);
  const canDelete = can(PERMISSIONS.DEPARTMENTS_DELETE);

  const [editDept, setEditDept] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);

  const columns = [
    {
      key: "name",
      label: "Department",
      className: "w-64",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FiLayers className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/departments/${id}`}
                className="font-semibold text-text hover:text-primary transition-colors truncate max-w-[220px]"
                onClick={(e) => e.stopPropagation()}
              >
                {row.name}
              </Link>
              <span className="font-mono text-[10px] text-muted truncate max-w-[150px]">
                ID: {id}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <p className="text-xs text-muted line-clamp-2 max-w-md">
          {row.description || "No description provided."}
        </p>
      ),
    },
    {
      key: "status",
      label: "Operational Status",
      className: "w-36",
      render: (row) => (
        <Badge
          variant={row.isActive ? "success" : "secondary"}
          size="sm"
          className="gap-1.5"
        >
          {row.isActive ? (
            <>
              <FiCheckCircle className="h-3 w-3" />
              <span>Active</span>
            </>
          ) : (
            <>
              <FiAlertCircle className="h-3 w-3" />
              <span>Inactive</span>
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Registered",
      className: "w-40",
      render: (row) => (
        <span className="text-xs text-muted">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-36 text-right",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {/* View Details */}
            <Link href={`/departments/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted hover:text-primary"
                title="View details"
              >
                <FiEye className="h-4 w-4" />
              </Button>
            </Link>

            {/* Edit */}
            {canUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditDept(row)}
                className="h-8 w-8 p-0 text-muted hover:text-amber-500"
                title="Edit department"
              >
                <FiEdit className="h-4 w-4" />
              </Button>
            )}

            {/* Delete / Deactivate */}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDept(row)}
                className="h-8 w-8 p-0 text-muted hover:text-danger"
                title="Deactivate or remove department"
              >
                <FiTrash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onRowClick={(row) => {
          const id = row.id || row._id;
          if (id) window.location.assign(`/departments/${id}`);
        }}
        emptyTitle="No departments found"
        emptyMessage="Create a new medical department or clear filter parameters."
        emptyIcon={<FiLayers className="h-8 w-8 text-muted" />}
        pagination={pagination}
      />

      {/* Quick Edit Modal */}
      <DepartmentFormModal
        open={Boolean(editDept)}
        onClose={() => setEditDept(null)}
        department={editDept}
        onSuccess={onRefresh}
      />

      {/* Delete / Deactivate Confirmation */}
      <DepartmentDeleteDialog
        open={Boolean(deleteDept)}
        onClose={() => setDeleteDept(null)}
        department={deleteDept}
        onSuccess={onRefresh}
      />
    </>
  );
}
