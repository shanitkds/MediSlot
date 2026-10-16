"use client";

import React from "react";
import Link from "next/link";
import { FiActivity, FiLogIn, FiGrid } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Navbar({ className }) {
  const { user } = useAuth();

  return (
    <header className={cn("sticky top-0 z-40 w-full border-b border-border/80 bg-surface/80 backdrop-blur-md", className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-md">
            <FiActivity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-text">
              Medi<span className="text-primary">Slot</span>
            </span>
            <span className="text-[10px] text-muted -mt-1 font-medium">Healthcare Scheduling</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" leftIcon={<FiGrid />}>
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm" leftIcon={<FiLogIn />}>
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
