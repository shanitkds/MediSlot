"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { can as canPermission } from "@/lib/permissions/can";
import {
  APP_PREFIXES,
  AUTH_PATHS,
  normalizeRole,
  getRoleDefaultRoute,
  canAccessRoute,
} from "@/constants/routes";

import { tokenManager } from "@/lib/auth/tokenManager";
import { disconnectSocket } from "@/lib/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const applyNormalizedUser = useCallback((rawUser) => {
    if (!rawUser) {
      setUser(null);
      return null;
    }
    const normRole = normalizeRole(rawUser);
    const normalized = {
      ...rawUser,
      role: normRole,
      isSuperAdmin: normRole === "super_admin" || Boolean(rawUser.isSuperAdmin),
    };
    setUser(normalized);
    return normalized;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await authService.me();
      return applyNormalizedUser(response?.data?.user);
    } catch {
      setUser(null);
      tokenManager.clearTokens();
      disconnectSocket();
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyNormalizedUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;

    const isApp = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isAuth = AUTH_PATHS.includes(pathname);

    // 1. Unauthenticated trying to access protected app routes
    if (isApp && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Authenticated user visiting auth pages (/login, /signup, etc.)
    if (isAuth && user) {
      const target = getRoleDefaultRoute(user.role);
      router.replace(target);
      return;
    }

    // 3. User verification status check
    if (isApp && user?.status === "pending_verification" && pathname !== "/dashboard") {
      router.replace("/dashboard");
      return;
    }

    // 4. Role-based route access guard for dashboard/app routes
    if (isApp && user && pathname !== "/forbidden") {
      if (!canAccessRoute(pathname, user)) {
        router.replace(`/forbidden?from=${encodeURIComponent(pathname)}`);
      }
    }
  }, [loading, pathname, router, user]);

  const login = useCallback(
    async (credentials) => {
      const res = await authService.login(credentials);
      if (res?.data?.user) {
        applyNormalizedUser(res.data.user);
      } else {
        await refresh();
      }
      return res;
    },
    [applyNormalizedUser, refresh]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      tokenManager.clearTokens();
      disconnectSocket();
      router.push("/login");
    }
  }, [router]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await authService.refresh();
      if (res?.data?.user) {
        applyNormalizedUser(res.data.user);
      }
      return res;
    } catch (err) {
      setUser(null);
      tokenManager.clearTokens();
      throw err;
    }
  }, [applyNormalizedUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      permissions: user?.permissions || [],
      refresh,
      setUser: applyNormalizedUser,
      login,
      logout,
      refreshToken,
      can: (permission) => {
        if (!permission) return true;
        if (user?.role === "super_admin" || user?.isSuperAdmin) return true;
        return canPermission(user?.permissions || [], permission);
      },
    }),
    [user, loading, refresh, applyNormalizedUser, login, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
