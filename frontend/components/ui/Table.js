import React from "react";
import { cn } from "@/lib/utils";

export function Table({
  columns,
  rows,
  empty = "No records found.",
  children,
  className,
  wrapperClassName,
  hoverable = true,
  ...props
}) {
  // If used declaratively with columns & rows props
  if (columns && rows) {
    return (
      <div className={cn("w-full overflow-x-auto rounded-lg border border-border bg-surface shadow-sm", wrapperClassName)}>
        <table className={cn("w-full text-left text-sm", className)} {...props}>
          <thead className="border-b border-border bg-slate-50/60 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted font-semibold">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("px-4 py-3.5", column.className)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-12 text-center text-muted"
                  colSpan={columns.length}
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className={cn(
                    "transition-colors",
                    hoverable && "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3.5 text-text", column.cellClassName)}>
                      {column.render ? column.render(row, idx) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // If used composably with children
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border bg-surface shadow-sm", wrapperClassName)}>
      <table className={cn("w-full text-left text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead
      className={cn(
        "border-b border-border bg-slate-50/60 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn("divide-y divide-border", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, hoverable = true, ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors",
        hoverable && "hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn("px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn("px-4 py-3.5 text-sm text-text", className)} {...props}>
      {children}
    </td>
  );
}
