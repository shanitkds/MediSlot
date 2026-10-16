"use client";

import React from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function SortButton({
  columnKey,
  sortField,
  sortOrder,
  currentSort,
  onSort,
  children,
  className,
}) {
  const activeField = currentSort ? currentSort.field : sortField;
  const activeOrder = currentSort ? currentSort.order : sortOrder;
  const isSorted = activeField === columnKey;

  const handleClick = () => {
    if (!onSort) return;
    if (!isSorted) {
      onSort(columnKey, "asc");
    } else if (activeOrder === "asc") {
      onSort(columnKey, "desc");
    } else {
      onSort(columnKey, "asc");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Sort by ${typeof children === "string" ? children : columnKey} ${isSorted ? activeOrder : ""}`}
      className={cn(
        "group inline-flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider transition-colors select-none cursor-pointer",
        isSorted ? "text-primary" : "text-muted hover:text-text",
        className
      )}
    >
      <span>{children}</span>
      <span className="flex flex-col">
        {isSorted ? (
          activeOrder === "asc" ? (
            <FiChevronUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          ) : (
            <FiChevronDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          )
        ) : (
          <span className="flex flex-col -space-y-1.5 opacity-40 group-hover:opacity-75 transition-opacity">
            <FiChevronUp className="h-2.5 w-2.5" aria-hidden="true" />
            <FiChevronDown className="h-2.5 w-2.5" aria-hidden="true" />
          </span>
        )}
      </span>
    </button>
  );
}
