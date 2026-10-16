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
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDoctors, useDeleteDoctor, useUpdateDoctor } from "@/hooks/queries/useDoctorQuery";
import { useDepartments } from "@/hooks/queries/useDepartmentQuery";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/contexts/ToastProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { formatDate } from "@/lib/utils";
import { FaUserMd } from "react-icons/fa";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiCalendar,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
} from "react-icons/fi";

export function DoctorsView() {
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.DOCTORS_CREATE);
  const canUpdate = can(PERMISSIONS.DOCTORS_UPDATE);
  const canDelete = can(PERMISSIONS.DOCTORS_DELETE);

  const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 10 });
  const { value: search, setValue: setSearch, debounced: debouncedSearch } = useDebouncedSearch("", 350);

  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [deleteDoctorItem, setDeleteDoctorItem] = useState(null);
  const [permanentDelete, setPermanentDelete] = useState(false);

  const { data: deptData } = useDepartments({ limit: 100 });
  const departments = deptData?.data?.items || deptData?.data?.departments || [];

  const queryParams = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
  };

  const {
    data: doctorsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDoctors(queryParams);

  const deleteMutation = useDeleteDoctor();
  const updateMutation = useUpdateDoctor();

  const doctors = doctorsData?.data?.items || doctorsData?.data?.doctors || doctorsData?.data || [];
  const pagination = doctorsData?.data?.pagination || {
    page,
    limit,
    total: doctors.length,
    totalPages: 1,
  };

  const handleActivateDoctor = async (row) => {
    const id = row.id || row._id;
    try {
      await updateMutation.mutateAsync({ id, status: "active" });
      toast.success("Doctor profile activated successfully.");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to activate doctor.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDoctorItem) return;
    const id = deleteDoctorItem.id || deleteDoctorItem._id;
    const isAlreadyDisabled = deleteDoctorItem.status === "disabled" || !deleteDoctorItem.isActive;
    const shouldPermanentlyDelete = permanentDelete || isAlreadyDisabled;

    try {
      const res = await deleteMutation.mutateAsync({ id, permanent: shouldPermanentlyDelete });
      if (shouldPermanentlyDelete || res?.data?.deleted) {
        toast.success("Doctor profile permanently removed.");
      } else {
        toast.success("Doctor profile deactivated successfully.");
      }
      setDeleteDoctorItem(null);
      setPermanentDelete(false);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to process doctor deletion.");
    }
  };

  const columns = [
    {
      key: "doctor",
      label: "Doctor Practitioner",
      className: "w-72",
      render: (row) => {
        const id = row.id || row._id;
        const name = row.userId?.name || row.user?.name || row.name || "Medical Doctor";
        const email = row.userId?.email || row.user?.email || row.email || "";
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} size="md" />
            <div className="flex flex-col min-w-0">
              <Link
                href={`/doctors/${id}`}
                className="font-semibold text-text hover:text-primary transition-colors truncate max-w-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                Dr. {name}
              </Link>
              {email && (
                <span className="text-xs text-muted truncate max-w-[180px]">
                  {email}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (row) => (
        <span className="text-xs font-medium text-text">
          {row.specialization || "General Medicine"}
        </span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row) => {
        const deptName = row.departmentId?.name || row.department?.name || "Unassigned";
        return (
          <Badge variant="outline" size="sm" className="gap-1">
            <FiLayers className="h-3 w-3 text-primary" />
            <span>{deptName}</span>
          </Badge>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      className: "w-28",
      render: (row) => {
        const isActive = row.status === "active" || row.isActive;
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
      className: "w-44 text-right",
      render: (row) => {
        const id = row.id || row._id;
        const isActive = row.status === "active" || row.isActive;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Link href={`/doctors/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted hover:text-primary"
                title="View details"
              >
                <FiEye className="h-4 w-4" />
              </Button>
            </Link>

            <Link href={`/doctors/${id}/schedule`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted hover:text-indigo-500"
                title="Schedule calendar"
              >
                <FiCalendar className="h-4 w-4" />
              </Button>
            </Link>

            {canUpdate && (
              <Link href={`/doctors/${id}/edit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted hover:text-amber-500"
                  title="Edit doctor"
                >
                  <FiEdit className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {!isActive && canUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivateDoctor(row)}
                className="h-8 w-8 p-0 text-muted hover:text-emerald-600"
                title="Reactivate doctor"
              >
                <FiCheckCircle className="h-4 w-4 text-emerald-500" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDeleteDoctorItem(row);
                  setPermanentDelete(!isActive);
                }}
                className="h-8 w-8 p-0 text-muted hover:text-danger"
                title={isActive ? "Deactivate / Delete doctor" : "Permanently delete doctor"}
              >
                <FiTrash2 className="h-4 w-4 text-rose-500" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PermissionGate
      roles={["super_admin", "admin", "receptionist"]}
      permission={PERMISSIONS.DOCTORS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="Doctor Management"
          description="View and configure hospital medical practitioners, specialties, and department allocations."
        />

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <Input
              placeholder="Search doctor by name or specialization..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<FiSearch className="h-4 w-4 text-muted" />}
              size="md"
            />

            <Select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              size="md"
            >
              <option value="">All Clinical Departments</option>
              {departments.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              size="md"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Inactive / Disabled</option>
            </Select>
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
              <Link href="/doctors/new">
                <Button variant="primary" size="md" className="gap-2 h-10 whitespace-nowrap">
                  <FiPlus className="h-4 w-4" />
                  Register Doctor
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={doctors}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No doctors found"
          emptyMessage="Register a medical doctor or refine search criteria."
          emptyIcon={<FaUserMd className="h-8 w-8 text-muted" />}
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

        {/* Deactivate / Delete Confirm */}
        <ConfirmDialog
          open={Boolean(deleteDoctorItem)}
          onClose={() => {
            setDeleteDoctorItem(null);
            setPermanentDelete(false);
          }}
          title={
            permanentDelete || deleteDoctorItem?.status === "disabled" || !deleteDoctorItem?.isActive
              ? `Permanently Delete Dr. ${deleteDoctorItem?.userId?.name || deleteDoctorItem?.user?.name || deleteDoctorItem?.name || "Doctor"}?`
              : `Deactivate Dr. ${deleteDoctorItem?.userId?.name || deleteDoctorItem?.user?.name || deleteDoctorItem?.name || "Doctor"}?`
          }
          description={
            permanentDelete || deleteDoctorItem?.status === "disabled" || !deleteDoctorItem?.isActive
              ? "This action will permanently delete this doctor profile and unbooked timetable slots from the database (allowed when zero appointments exist)."
              : "Deactivating this doctor profile disables further patient bookings while preserving past clinical appointment history. Check below if you wish to permanently delete instead."
          }
          confirmLabel={
            permanentDelete || deleteDoctorItem?.status === "disabled" || !deleteDoctorItem?.isActive
              ? "Delete Permanently"
              : "Deactivate"
          }
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        >
          {deleteDoctorItem?.status === "active" && deleteDoctorItem?.isActive && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <input
                type="checkbox"
                id="permanentDeleteCheckbox"
                checked={permanentDelete}
                onChange={(e) => setPermanentDelete(e.target.checked)}
                className="h-4 w-4 rounded border-border text-danger focus:ring-danger cursor-pointer"
              />
              <label htmlFor="permanentDeleteCheckbox" className="text-xs text-text select-none cursor-pointer">
                Delete permanently (only if doctor has 0 appointments)
              </label>
            </div>
          )}
        </ConfirmDialog>
      </PageContainer>
    </PermissionGate>
  );
}
