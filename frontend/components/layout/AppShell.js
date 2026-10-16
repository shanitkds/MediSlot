"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Header } from "./Header";
import { useAuth } from "@/contexts/AuthProvider";
import { LoadingState } from "@/components/common/LoadingState";
import { AccessDenied } from "@/components/permissions/AccessDenied";
import { canAccessRoute, getRouteRequiredAccess } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function AppShell({ children, className }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Proactively redirect to login if user is unauthenticated
  React.useEffect(() => {
    if (!loading && !user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      window.location.replace(`/login${next}`);
    }
  }, [loading, user, pathname]);

  // 1. While auth state is resolving, render full-page loader
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <LoadingState
          message="Verifying credentials & clinical authorizations..."
          fullPage
        />
      </div>
    );
  }

  // 2. If unauthenticated, render waiting state while redirecting
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <LoadingState message="Redirecting to login..." fullPage />
      </div>
    );
  }

  // 3. Check role/permission access for current route
  const isForbiddenPage = pathname === "/forbidden";
  const hasAccess = isForbiddenPage || canAccessRoute(pathname, user);
  const requiredRule = !hasAccess ? getRouteRequiredAccess(pathname) : null;

  return (
    <div className={cn("flex h-screen overflow-hidden bg-bg text-text", className)}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {hasAccess ? (
            children
          ) : (
            <div className="p-4 sm:p-8">
              <AccessDenied
                roles={requiredRule?.roles}
                permission={requiredRule?.permission}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
