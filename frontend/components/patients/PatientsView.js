"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePatients, useDeletePatient } from "@/hooks/queries/usePatientQuery";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/contexts/ToastProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { formatDate } from "@/lib/utils";
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiPhone,
} from "react-icons/fi";

function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function PatientsView() {
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.PATIENTS_CREATE);
  const canUpdate = can(PERMISSIONS.PATIENTS_UPDATE);
  const canDelete = can(PERMISSIONS.PATIENTS_DELETE);

  const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 10 });
  const { value: search, setValue: setSearch, debounced: debouncedSearch } = useDebouncedSearch("", 350);

  const [deletePatientItem, setDeletePatientItem] = useState(null);

  const queryParams = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const {
    data: patientsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePatients(queryParams);

  const deleteMutation = useDeletePatient();

  const patients =
    patientsData?.data?.items ||
    patientsData?.data?.patients ||
    patientsData?.data ||
    [];

  const pagination = patientsData?.data?.pagination || {
    page,
    limit,
    total: patients.length,
    totalPages: 1,
  };

  const handleDeleteConfirm = async () => {
    if (!deletePatientItem) return;
    const id = deletePatientItem.id || deletePatientItem._id;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Patient "${deletePatientItem.name}" deactivated successfully.`);
      setDeletePatientItem(null);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate patient.");
    }
  };

  const columns = [
    {
      key: "patient",
      label: "Patient",
      className: "w-64",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} size="md" />
            <div className="flex flex-col min-w-0">
              <Link
                href={`/patients/${id}`}
                className="font-semibold text-text hover:text-primary transition-colors truncate max-w-[180px]"
                onClick={(e) => e.stopPropagation()}
              >
                {row.name}
              </Link>
              <span className="font-mono text-xs text-primary font-medium">
                {row.patientId || `ID: ${id}`}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "contact",
      label: "Contact Mobile",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-text">
          <FiPhone className="h-3 w-3 text-muted shrink-0" />
          <span>{row.mobile || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "demographics",
      label: "Gender / Age",
      render: (row) => {
        const age = calculateAge(row.dateOfBirth);
        return (
          <span className="text-xs text-muted capitalize">
            {row.gender || "—"} {age ? `(${age} yrs)` : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      className: "w-28",
      render: (row) => {
        const isActive = row.status === "active" || row.isActive !== false;
        return (
          <Badge variant={isActive ? "success" : "secondary"} size="sm">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-36 text-right",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Link href={`/patients/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted hover:text-primary"
                title="View details"
              >
                <FiEye className="h-4 w-4" />
              </Button>
            </Link>

            {canUpdate && (
              <Link href={`/patients/${id}/edit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted hover:text-amber-500"
                  title="Edit patient"
                >
                  <FiEdit className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletePatientItem(row)}
                className="h-8 w-8 p-0 text-muted hover:text-danger"
                title="Deactivate patient"
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
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.PATIENTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="Patient Directory"
          description="Registered patients, demographics, clinical records, and appointment history."
        />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by patient ID, name, or phone number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<FiSearch className="h-4 w-4 text-muted" />}
              size="md"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => refetch()}
              loading={isFetching}
              title="Refresh"
              className="h-10 px-3"
            >
              <FiRefreshCw className={isFetching ? "animate-spin h-4 w-4" : "h-4 w-4"} />
            </Button>

            {canCreate && (
              <Link href="/patients/new">
                <Button variant="primary" size="md" className="gap-2 h-10 whitespace-nowrap">
                  <FiPlus className="h-4 w-4" />
                  Register Patient
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Patients Table */}
        <DataTable
          columns={columns}
          data={patients}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No patients found"
          emptyMessage="Register a patient or adjust your search filter."
          emptyIcon={<FiUsers className="h-8 w-8 text-muted" />}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            pageSize: pagination.limit,
            totalItems: pagination.total,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
            pageSizeOptions: [10, 20, 50],
          }}
        />

        {/* Deactivate Confirm */}
        <ConfirmDialog
          open={Boolean(deletePatientItem)}
          onClose={() => setDeletePatientItem(null)}
          title={`Deactivate ${deletePatientItem?.name || "Patient"}?`}
          description="Deactivating this patient record cancels upcoming scheduled appointments and blocks new bookings while preserving historical records."
          confirmLabel="Deactivate Patient"
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        />
      </PageContainer>
    </PermissionGate>
  );
}
