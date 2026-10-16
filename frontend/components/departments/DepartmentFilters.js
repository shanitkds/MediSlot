"use client";

import React from "react";
import { FiSearch, FiPlus, FiRefreshCw, FiX } from "react-icons/fi";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthProvider";
import { PERMISSIONS } from "@/constants/permissions";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active Units Only" },
  { value: "false", label: "Inactive / Paused" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "name", label: "Name (A - Z)" },
  { value: "-name", label: "Name (Z - A)" },
];

export function DepartmentFilters({
  search = "",
  onSearchChange,
  status = "",
  onStatusChange,
  sort = "-createdAt",
  onSortChange,
  onReset,
  onRefresh,
  onAddNew,
  loading = false,
}) {
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.DEPARTMENTS_CREATE);

  const hasActiveFilters = Boolean(search) || Boolean(status) || sort !== "-createdAt";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left Side: Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Search */}
          <div className="sm:col-span-1">
            <Input
              id="department-search-input"
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              leftIcon={<FiSearch className="h-4 w-4 text-muted" />}
              size="md"
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              id="department-status-filter"
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
              size="md"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Sort Filter */}
          <div>
            <Select
              id="department-sort-filter"
              value={sort}
              onChange={(e) => onSortChange?.(e.target.value)}
              size="md"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Right Side: Quick Action */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            id="department-refresh-btn"
            variant="outline"
            size="md"
            onClick={onRefresh}
            loading={loading}
            title="Refresh list"
            className="h-10 px-3"
          >
            <FiRefreshCw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
          </Button>

          {canCreate && (
            <Button
              id="add-department-btn"
              variant="primary"
              size="md"
              onClick={onAddNew}
              className="gap-2 h-10 whitespace-nowrap"
            >
              <FiPlus className="h-4 w-4" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* Filter Status Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <span className="text-primary font-medium">Filtered results</span>
          <Button
            id="department-reset-filters-btn"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 text-xs text-muted hover:text-text"
          >
            <FiX className="h-3 w-3" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
