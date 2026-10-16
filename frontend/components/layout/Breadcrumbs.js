"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

const routeLabels = {
  dashboard: "Dashboard",
  users: "Users",
  new: "Create New",
  edit: "Edit",
  departments: "Departments",
  doctors: "Doctors",
  patients: "Patients",
  schedules: "Schedules",
  slots: "Slots",
  generate: "Generate",
  profile: "Profile",
  settings: "Settings",
  security: "Security",
  "audit-logs": "Audit Logs",
  notifications: "Notifications",
  forbidden: "Forbidden",
};

export function Breadcrumbs({ className }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1.5 text-xs text-muted", className)}>
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-text transition-colors"
        aria-label="Home"
      >
        <FiHome className="h-3.5 w-3.5" />
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || segment.replace(/-/g, " ");

        return (
          <React.Fragment key={href}>
            <FiChevronRight className="h-3 w-3 text-muted/60 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-text capitalize truncate max-w-[140px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-text transition-colors capitalize truncate max-w-[120px] sm:max-w-none"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
