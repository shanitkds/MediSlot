"use client";

import React from "react";
import { FiMenu } from "react-icons/fi";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

export function Header({ onMenuClick, className }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-surface/85 px-4 sm:px-6 backdrop-blur-md transition-colors",
        className
      )}
    >
      {/* Left side: Mobile Menu Button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors shadow-sm lg:hidden cursor-pointer"
        >
          <FiMenu className="h-4 w-4" />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right side: Notifications & User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
