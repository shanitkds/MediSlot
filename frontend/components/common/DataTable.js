"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortButton } from "./SortButton";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { Pagination } from "./Pagination";
import { cn } from "@/lib/utils";

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  // Sorting
  sortField,
  sortOrder,
  onSort,
  // Selection
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  // Row click
  onRowClick,
  // Empty state
  emptyTitle = "No records found",
  emptyMessage = "There are no records matching your current filter criteria.",
  emptyAction,
  emptyIcon,
  // Pagination
  pagination,
  className,
  wrapperClassName,
}) {
  const allRowIds = data.map((item, idx) => item.id ?? idx);
  const isAllSelected =
    data.length > 0 && allRowIds.every((id) => selectedIds.includes(id));
  const isSomeSelected =
    data.length > 0 &&
    allRowIds.some((id) => selectedIds.includes(id)) &&
    !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectAll?.([]);
    } else {
      onSelectAll?.(allRowIds);
    }
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      onSelectRow?.(selectedIds.filter((item) => item !== id));
    } else {
      onSelectRow?.([...selectedIds, id]);
    }
  };

  // 1. Error state
  if (error) {
    return (
      <div className={cn("rounded-lg border border-border bg-surface p-6", wrapperClassName)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  // 2. Loading state
  if (loading && data.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-surface p-4", wrapperClassName)}>
        <LoadingState variant="skeleton" rows={5} />
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-0 rounded-lg border border-border bg-surface shadow-sm overflow-hidden", wrapperClassName)}>
      <div className="overflow-x-auto">
        <Table className={className}>
          <TableHeader>
            <TableRow hoverable={false}>
              {selectable && (
                <TableHead className="w-12 px-4 py-3.5">
                  <Checkbox
                    checked={isAllSelected}
                    aria-label="Select all rows"
                    onChange={handleSelectAll}
                  />
                </TableHead>
              )}

              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.sortable && onSort ? (
                    <SortButton
                      columnKey={column.key}
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={onSort}
                    >
                      {column.label}
                    </SortButton>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell
                  className="px-4 py-12 text-center"
                  colSpan={columns.length + (selectable ? 1 : 0)}
                >
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyMessage}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const rowId = row.id ?? idx;
                const isSelected = selectedIds.includes(rowId);

                return (
                  <TableRow
                    key={rowId}
                    hoverable={true}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-primary/5 dark:bg-primary/10"
                    )}
                  >
                    {selectable && (
                      <TableCell className="w-12 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          aria-label={`Select row ${rowId}`}
                          onChange={(e) => handleSelectRow(rowId, e)}
                        />
                      </TableCell>
                    )}

                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn("px-4 py-3.5 text-text", column.cellClassName)}
                      >
                        {column.render
                          ? column.render(row, idx)
                          : row[column.key] ?? "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions}
        />
      )}
    </div>
  );
}
