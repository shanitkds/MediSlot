"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiFileText,
  FiShield,
  FiActivity,
  FiLogOut,
  FiLayers,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { normalizeRole } from "@/constants/routes";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: FiGrid,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: FiCalendar,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
  {
    href: "/users",
    label: "User Management",
    icon: FiUsers,
    roles: ["super_admin", "admin"],
  },
  {
    href: "/departments",
    label: "Departments",
    icon: FiLayers,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
  {
    href: "/doctors",
    label: "Doctors",
    icon: FaUserMd,
    roles: ["super_admin", "receptionist", "admin"],
  },
  {
    href: "/schedules",
    label: "Doctor Schedules",
    icon: FiCalendar,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
  {
    href: "/slots",
    label: "Slot Generator & Times",
    icon: FiClock,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
  {
    href: "/patients",
    label: "Patients",
    icon: FiUserCheck,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
  {
    href: "/audit-logs",
    label: "Audit Logs",
    icon: FiFileText,
    roles: ["super_admin", "admin"],
  },
  {
    href: "/settings/security",
    label: "Security Settings",
    icon: FiShield,
    roles: ["super_admin", "doctor", "receptionist", "admin"],
  },
];

export function Sidebar({ className }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const toast = useToast();

  const userRole = normalizeRole(user);

  const allowedNav = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 h-screen sticky top-0 shrink-0 border-r border-border bg-surface text-text select-none z-20",
        className
      )}
    >
      {/* Brand Logo Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/80 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-sm">
          <FiActivity className="h-5 w-5" />
        </div>
        <div>
          <span className="font-display text-base font-bold tracking-tight text-text">
            Medi<span className="text-primary">Slot</span>
          </span>
          <p className="text-[10px] text-muted -mt-0.5 font-medium">Hospital System</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Main Navigation
        </p>

        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-muted group-hover:text-text"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom User Profile Section */}
      <div className="border-t border-border/80 p-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name || "User"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[10px] text-muted capitalize">
                {user?.role || "Staff"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-slate-200 hover:text-danger dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FiLogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
