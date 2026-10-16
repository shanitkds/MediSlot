"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  menuClassName,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <div onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute z-40 mt-2 min-w-[12rem] rounded-lg border border-border bg-surface p-1 text-text shadow-lg ring-1 ring-black/5 dark:ring-white/5 animate-scaleUp",
            align === "right" ? "right-0" : "left-0",
            menuClassName
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer select-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40"
          : "text-text hover:bg-slate-100 dark:hover:bg-slate-800",
        className
      )}
      {...props}
    >
      {icon && <span className="h-4 w-4 shrink-0 text-muted">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownHeader({ children, className }) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownDivider({ className }) {
  return <div className={cn("my-1 h-px bg-border", className)} role="separator" />;
}
