"use client";

import React from "react";
import { FiSearch, FiRefreshCw, FiX } from "react-icons/fi";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const MODULE_OPTIONS = [
  { value: "", label: "All Modules" },
  { value: "auth", label: "Auth & Sessions" },
  { value: "departments", label: "Departments" },
  { value: "doctors", label: "Doctors" },
  { value: "patients", label: "Patients" },
  { value: "appointments", label: "Appointments" },
  { value: "doctorschedule", label: "Schedules" },
  { value: "slots", label: "Slots" },
  { value: "users", label: "Users" },
  { value: "roles", label: "Roles & Permissions" },
  { value: "settings", label: "Settings" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "Super Admin", label: "Super Admin" },
  { value: "Doctor", label: "Doctor" },
  { value: "Receptionist", label: "Receptionist" },
  { value: "Admin", label: "Admin" },
];

export function AuditLogFilters({
  search = "",
  onSearchChange,
  selectedModule = "",
  onModuleChange,
  selectedAction = "",
  onActionChange,
  selectedRole = "",
  onRoleChange,
  onReset,
  onRefresh,
  loading = false,
}) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedModule) ||
    Boolean(selectedAction) ||
    Boolean(selectedRole);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            id="audit-search-input"
            type="text"
            placeholder="Search by actor email, user ID, or entity ID..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            leftIcon={<FiSearch className="h-4 w-4 text-muted" />}
            size="md"
          />
        </div>

        {/* Module Filter */}
        <div>
          <Select
            id="audit-module-filter"
            value={selectedModule}
            onChange={(e) => onModuleChange?.(e.target.value)}
            size="md"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Action Filter */}
        <div>
          <Select
            id="audit-action-filter"
            value={selectedAction}
            onChange={(e) => onActionChange?.(e.target.value)}
            size="md"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Role Filter */}
        <div>
          <Select
            id="audit-role-filter"
            value={selectedRole}
            onChange={(e) => onRoleChange?.(e.target.value)}
            size="md"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Filter Status Bar */}
      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="text-muted">
          {hasActiveFilters ? (
            <span className="text-primary font-medium">Filtering active records</span>
          ) : (
            "Showing all recent audit logs"
          )}
        </span>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              id="audit-reset-filters-btn"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1 text-xs text-muted hover:text-text"
            >
              <FiX className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}

          <Button
            id="audit-refresh-btn"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            loading={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <FiRefreshCw className={loading ? "animate-spin h-3.5 w-3.5" : "h-3.5 w-3.5"} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
