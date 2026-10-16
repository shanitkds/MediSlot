"use client";

import React, { useState } from "react";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { AuditStats } from "./AuditStats";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogsTable } from "./AuditLogsTable";
import { useAuditLogs } from "@/hooks/queries/useAuditQuery";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/contexts/ToastProvider";

export function AuditLogsView() {
  const toast = useToast();
  const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 20 });
  const { value: search, setValue: setSearch, debounced: debouncedSearch } = useDebouncedSearch("", 350);

  const [selectedModule, setSelectedModule] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Build query params
  const queryParams = {
    page,
    limit,
    ...(debouncedSearch ? { userId: debouncedSearch } : {}),
    ...(selectedModule ? { module: selectedModule } : {}),
    ...(selectedAction ? { action: selectedAction } : {}),
    ...(selectedRole ? { role: selectedRole } : {}),
  };

  const {
    data: auditData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAuditLogs(queryParams);

  const items = auditData?.data?.items || [];
  const pagination = auditData?.data?.pagination || {
    page,
    limit,
    total: items.length,
    totalPages: 1,
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedModule("");
    setSelectedAction("");
    setSelectedRole("");
    setPage(1);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Audit records refreshed");
    } catch {
      toast.error("Failed to refresh audit logs");
    }
  };

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.AUDIT_VIEW}
    >
      <PageContainer maxWidth="wide" className="space-y-6">
        <PageHeader
          title="System Audit Trail"
          description="Complete chronological timeline of security events, administrative changes, and user operations across all modules."
        />

        {/* Aggregate Stats Cards */}
        <AuditStats
          items={items}
          total={pagination.total || items.length}
          loading={isLoading}
        />

        {/* Filters & Search Bar */}
        <AuditLogFilters
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          selectedModule={selectedModule}
          onModuleChange={(val) => {
            setSelectedModule(val);
            setPage(1);
          }}
          selectedAction={selectedAction}
          onActionChange={(val) => {
            setSelectedAction(val);
            setPage(1);
          }}
          selectedRole={selectedRole}
          onRoleChange={(val) => {
            setSelectedRole(val);
            setPage(1);
          }}
          onReset={handleResetFilters}
          onRefresh={handleRefresh}
          loading={isFetching}
        />

        {/* Interactive Data Table */}
        <AuditLogsTable
          logs={items}
          loading={isLoading}
          error={error}
          onRetry={refetch}
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
            pageSizeOptions: [10, 20, 50, 100],
          }}
        />
      </PageContainer>
    </PermissionGate>
  );
}
