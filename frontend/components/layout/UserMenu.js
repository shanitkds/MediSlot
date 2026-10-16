"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiShield, FiLogOut, FiChevronDown } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from "@/components/ui/Dropdown";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/contexts/ToastProvider";
import { normalizeRole } from "@/constants/routes";

export function UserMenu({ className }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const displayName = user?.name || "Medical User";
  const displayEmail = user?.email || "user@medislot.com";
  const displayRole = normalizeRole(user).replace("_", " ");

  return (
    <Dropdown
      align="right"
      className={className}
      trigger={
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-1.5 sm:px-3 sm:py-1.5 text-left text-xs font-medium text-text shadow-sm hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
        >
          <Avatar name={displayName} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="font-semibold text-text leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted capitalize">{displayRole}</p>
          </div>
          <FiChevronDown className="h-3.5 w-3.5 text-muted hidden sm:block" />
        </button>
      }
    >
      <DropdownHeader className="pb-2">
        <p className="font-semibold text-text text-xs">{displayName}</p>
        <p className="text-[11px] text-muted lowercase truncate">{displayEmail}</p>
        <div className="mt-1">
          <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary capitalize">
            {displayRole}
          </span>
        </div>
      </DropdownHeader>

      <DropdownDivider />

      <Link href="/profile">
        <DropdownItem icon={<FiUser />}>
          <span>My Profile</span>
        </DropdownItem>
      </Link>

      <Link href="/settings/security">
        <DropdownItem icon={<FiShield />}>
          <span>Security & Password</span>
        </DropdownItem>
      </Link>

      <DropdownDivider />

      <DropdownItem icon={<FiLogOut />} danger onClick={handleLogout}>
        <span>Sign Out</span>
      </DropdownItem>
    </Dropdown>
  );
}
