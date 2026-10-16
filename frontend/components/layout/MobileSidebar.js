"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiX, FiActivity, FiLogOut } from "react-icons/fi";
import { navigationItems } from "./Sidebar";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { normalizeRole } from "@/constants/routes";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function MobileSidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const toast = useToast();

  const userRole = normalizeRole(user);
  const allowedNav = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  // Close when pathname changes
  useEffect(() => {
    onClose?.();
  }, [pathname, onClose]);

  if (!open) return null;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-surface border-r border-border text-text shadow-2xl transition-transform duration-300">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/80 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-sm">
              <FiActivity className="h-5 w-5" />
            </div>
            <span className="font-display text-base font-bold text-text">
              Medi<span className="text-primary">Slot</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-muted")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom User info */}
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
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-slate-200 hover:text-danger dark:hover:bg-slate-700 transition-colors"
            >
              <FiLogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
