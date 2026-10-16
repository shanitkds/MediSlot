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
import { useUsers, useDeleteUser } from "@/hooks/queries/useUserQuery";
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
  FiShield,
} from "react-icons/fi";

function getRoleBadgeVariant(role) {
  switch (role?.toLowerCase()) {
    case "super_admin":
    case "super admin":
      return "primary";
    case "doctor":
      return "info";
    case "receptionist":
      return "success";
    case "admin":
      return "warning";
    default:
      return "secondary";
  }
}

export function UsersView() {
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.USERS_CREATE);
  const canUpdate = can(PERMISSIONS.USERS_UPDATE);
  const canDelete = can(PERMISSIONS.USERS_DELETE);

  const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 10 });
  const { value: search, setValue: setSearch, debounced: debouncedSearch } = useDebouncedSearch("", 350);

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deleteUserItem, setDeleteUserItem] = useState(null);

  const queryParams = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const {
    data: usersData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useUsers(queryParams);

  const deleteMutation = useDeleteUser();

  const users = usersData?.data?.items || usersData?.data?.users || usersData?.data || [];
  const pagination = usersData?.data?.pagination || {
    page,
    limit,
    total: users.length,
    totalPages: 1,
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserItem) return;
    const id = deleteUserItem.id || deleteUserItem._id;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`User "${deleteUserItem.name}" deleted successfully.`);
      setDeleteUserItem(null);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to delete user.");
    }
  };

  const columns = [
    {
      key: "user",
      label: "User Identity",
      className: "w-64",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} size="md" />
            <div className="flex flex-col min-w-0">
              <Link
                href={`/users/${id}`}
                className="font-semibold text-text hover:text-primary transition-colors truncate max-w-[180px]"
                onClick={(e) => e.stopPropagation()}
              >
                {row.name}
              </Link>
              <span className="text-xs text-muted truncate max-w-[180px]">{row.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      className: "w-36",
      render: (row) => (
        <Badge variant={getRoleBadgeVariant(row.role)} size="sm" className="capitalize">
          {row.role ? row.role.replace("_", " ") : "Member"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-28",
      render: (row) => {
        const isActive = row.status === "active" || row.isActive;
        return (
          <Badge variant={isActive ? "success" : "secondary"} size="sm">
            {row.status || (isActive ? "active" : "inactive")}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      label: "Joined",
      className: "w-36",
      render: (row) => <span className="text-xs text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-36 text-right",
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Link href={`/users/${id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted hover:text-primary" title="View details">
                <FiEye className="h-4 w-4" />
              </Button>
            </Link>

            {canUpdate && (
              <Link href={`/users/${id}/edit`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted hover:text-amber-500" title="Edit user">
                  <FiEdit className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteUserItem(row)}
                className="h-8 w-8 p-0 text-muted hover:text-danger"
                title="Delete user"
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
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.USERS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage hospital doctors, receptionists, and administrative personnel accounts."
        />

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 sm:max-w-xl">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<FiSearch className="h-4 w-4 text-muted" />}
              size="md"
            />

            <Select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              size="md"
            >
              <option value="">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="receptionist">Receptionists</option>
              <option value="admin">Administrators</option>
              <option value="super_admin">Super Admins</option>
            </Select>

            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              size="md"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
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
              <div className="flex items-center gap-2">
                <Link href="/users/new-doctor">
                  <Button variant="outline" size="md" className="gap-1.5 h-10 text-xs">
                    <FiPlus className="h-3.5 w-3.5" />
                    Doctor Account
                  </Button>
                </Link>
                <Link href="/users/new-receptionist">
                  <Button variant="primary" size="md" className="gap-1.5 h-10 text-xs">
                    <FiPlus className="h-3.5 w-3.5" />
                    Receptionist Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          columns={columns}
          data={users}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No users found"
          emptyMessage="Create a new doctor or receptionist login account."
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

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={Boolean(deleteUserItem)}
          onClose={() => setDeleteUserItem(null)}
          title={`Delete ${deleteUserItem?.name || "User"}?`}
          description="Are you sure you want to delete this user? Their account access will be terminated."
          confirmLabel="Delete User"
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        />
      </PageContainer>
    </PermissionGate>
  );
}
