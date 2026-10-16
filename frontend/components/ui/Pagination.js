"use client";

import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  onPage,
  totalItems,
  pageSize,
  className,
}) {
  const handlePage = onPageChange || onPage || (() => {});

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 border-t border-border bg-surface",
        className
      )}
    >
      <div className="text-xs md:text-sm text-muted">
        {totalItems !== undefined && pageSize !== undefined ? (
          <span>
            Showing <span className="font-medium text-text">{Math.min((page - 1) * pageSize + 1, totalItems)}</span> to{" "}
            <span className="font-medium text-text">{Math.min(page * pageSize, totalItems)}</span> of{" "}
            <span className="font-medium text-text">{totalItems}</span> results
          </span>
        ) : (
          <span>
            Page <span className="font-medium text-text">{page}</span> of{" "}
            <span className="font-medium text-text">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => handlePage(page - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted select-none">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePage(p)}
                className={cn(
                  "h-8 min-w-8 px-2.5 text-xs font-medium rounded-md transition-colors select-none",
                  page === p
                    ? "bg-primary text-white shadow-sm"
                    : "text-text hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => handlePage(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <FiChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
