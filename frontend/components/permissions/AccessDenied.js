"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLock, FiArrowLeft, FiHome } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function AccessDenied({
  title = "Access Restricted",
  description,
  permission,
  roles,
  showBackButton = true,
  className,
}) {
  const router = useRouter();

  const detailsText =
    description ||
    (permission
      ? `This area requires the "${permission}" permission which is not assigned to your account.`
      : roles
      ? `This area is restricted to [${Array.isArray(roles) ? roles.join(", ") : roles}] roles.`
      : "You do not possess the required security authorization to view or manage this clinical section.");

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 sm:p-12 text-center shadow-md max-w-lg mx-auto my-8 space-y-4 animate-scaleUp",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shadow-inner">
        <FiLock className="h-8 w-8" />
      </div>

      <div className="space-y-1.5">
        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          403 Forbidden
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-text">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm">
          {detailsText}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-3 flex-wrap justify-center">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            leftIcon={<FiArrowLeft />}
          >
            Go Back
          </Button>
        )}

        <Link href="/dashboard">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FiHome />}
          >
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
