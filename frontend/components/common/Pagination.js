"use client";

import React from "react";
import { Pagination as BasePagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";

export function Pagination({
  page = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      <div className="w-full sm:w-auto">
        <BasePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          className="border-t-0 p-0"
        />
      </div>
    </div>
  );
}
