"use client";

import React from "react";
import { FiX } from "react-icons/fi";
import { SearchInput } from "./SearchInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function SearchFilter({
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  loading = false,
  filters,
  hasActiveFilters = false,
  onClearFilters,
  actions,
  resultsCount,
  className,
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input + Filter controls */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:max-w-xs md:max-w-sm">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              onSearch={onSearch}
              placeholder={searchPlaceholder}
              loading={loading}
            />
          </div>

          {filters && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters}
            </div>
          )}

          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-muted hover:text-danger shrink-0"
            >
              <FiX className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Action buttons + Result count */}
        <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
          {resultsCount !== undefined && (
            <span className="text-xs font-medium text-muted">
              {resultsCount} {resultsCount === 1 ? "result" : "results"}
            </span>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
