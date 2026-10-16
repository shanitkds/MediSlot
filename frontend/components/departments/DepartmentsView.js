"use client";

import React, { useState } from "react";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { DepartmentStats } from "./DepartmentStats";
import { DepartmentFilters } from "./DepartmentFilters";
import { DepartmentTable } from "./DepartmentTable";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { useDepartments } from "@/hooks/queries/useDepartmentQuery";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/contexts/ToastProvider";

export function DepartmentsView() {
  const toast = useToast();
  const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 10 });
  const { value: search, setValue: setSearch, debounced: debouncedSearch } = useDebouncedSearch("", 350);

  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Build query
  const queryParams = {
    page,
    limit,
    sort,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== "" ? { isActive: status === "true" } : {}),
  };

  const {
    data: deptsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDepartments(queryParams);

  const departments =
    deptsData?.data?.items ||
    deptsData?.data?.departments ||
    deptsData?.data ||
    [];

  const pagination = deptsData?.data?.pagination || {
    page,
    limit,
    total: departments.length,
    totalPages: 1,
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setSort("-createdAt");
    setPage(1);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Departments refreshed");
    } catch {
      toast.error("Failed to refresh departments");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.DEPARTMENTS_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="Departments & Clinical Units"
          description="Manage clinical medical divisions, outpatient specialties, and hospital practice areas."
        />

        {/* Aggregated Metric Cards */}
        <DepartmentStats
          departments={departments}
          total={pagination.total || departments.length}
          loading={isLoading}
        />

        {/* Filter & Search Bar */}
        <DepartmentFilters
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          sort={sort}
          onSortChange={(val) => {
            setSort(val);
            setPage(1);
          }}
          onReset={handleResetFilters}
          onRefresh={handleRefresh}
          onAddNew={() => setCreateModalOpen(true)}
          loading={isFetching}
        />

        {/* Main Data Table */}
        <DepartmentTable
          departments={departments}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          onRefresh={refetch}
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

        {/* Create Modal */}
        <DepartmentFormModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={refetch}
        />
      </PageContainer>
    </PermissionGate>
  );
}
