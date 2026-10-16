"use client";

import React from "react";
import { FiSearch, FiX, FiLoader } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  loading = false,
  className,
  wrapperClassName,
  disabled = false,
  ...props
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={cn("relative flex w-full items-center", wrapperClassName)}>
      <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted">
        {loading ? (
          <FiLoader className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <FiSearch className="h-4 w-4" aria-hidden="true" />
        )}
      </div>

      <input
        type="search"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-surface pl-9 pr-9 text-sm text-text placeholder:text-muted transition-colors",
          "outline-none ring-offset-bg",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-slate-200 hover:text-text dark:hover:bg-slate-700 transition-colors"
        >
          <FiX className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
