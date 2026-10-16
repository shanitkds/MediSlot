export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  dashboard: "/dashboard",
  users: "/users",
  departments: "/departments",
  doctors: "/doctors",
  schedules: "/schedules",
  slots: "/slots",
  patients: "/patients",
  appointments: "/appointments",
  newAppointment: "/appointments/new",
  roles: "/roles",
  notifications: "/notifications",
  profile: "/profile",
  security: "/settings/security",
  application: "/settings/application",
  permissions: "/settings/permissions",
  auditLogs: "/audit-logs",
  forbidden: "/forbidden",
};

export const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export const AUTH_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export const APP_PREFIXES = [
  "/dashboard",
  "/users",
  "/departments",
  "/doctors",
  "/schedules",
  "/slots",
  "/patients",
  "/appointments",
  "/profile",
  "/settings",
  "/audit-logs",
  "/notifications",
  "/forbidden",
];

/**
 * Standard default landing routes when redirecting users based on their role
 */
export const ROLE_DEFAULT_ROUTES = {
  super_admin: "/dashboard",
  admin: "/dashboard",
  doctor: "/dashboard",
  receptionist: "/dashboard",
  member: "/profile",
};

/**
 * Granular Role and Permission route access matrix for dashboard routes
 */
export const ROUTE_ACCESS_RULES = [
  {
    prefix: "/dashboard",
    roles: ["super_admin", "admin", "doctor", "receptionist"],
    permission: "dashboard.view",
  },
  {
    prefix: "/users",
    roles: ["super_admin", "admin"],
    permission: "users.view",
  },
  {
    prefix: "/roles",
    roles: ["super_admin", "admin"],
    permission: "roles.view",
  },
  {
    prefix: "/audit-logs",
    roles: ["super_admin", "admin"],
    permission: "audit.view",
  },
  {
    prefix: "/departments",
    roles: ["super_admin", "admin", "doctor", "receptionist"],
    permission: "departments.view",
  },
  {
    prefix: "/doctors",
    roles: ["super_admin", "admin", "receptionist"],
    permission: "doctors.view",
  },
  {
    prefix: "/schedules",
    roles: ["super_admin", "admin", "doctor", "receptionist"],
    permission: "doctorschedule.view",
  },
  {
    prefix: "/slots",
    roles: ["super_admin", "admin", "doctor", "receptionist"],
    permission: "slots.view",
  },
  {
    prefix: "/patients",
    roles: ["super_admin", "admin", "doctor", "receptionist"],
    permission: "patients.view",
  },
  {
    prefix: "/appointments",
    roles: ["super_admin", "admin", "doctor", "receptionist"],
    permission: "appointments.view",
  },
  {
    prefix: "/settings",
    roles: ["super_admin", "admin", "doctor", "receptionist", "member"],
  },
  {
    prefix: "/profile",
    roles: ["super_admin", "admin", "doctor", "receptionist", "member"],
  },
  {
    prefix: "/notifications",
    roles: ["super_admin", "admin", "doctor", "receptionist", "member"],
  },
  {
    prefix: "/forbidden",
    roles: ["super_admin", "admin", "doctor", "receptionist", "member"],
  },
];

/**
 * Consistently normalize role string from various user payload formats
 */
export function normalizeRole(userOrRole) {
  if (!userOrRole) return "staff";
  if (typeof userOrRole === "string") {
    return userOrRole.toLowerCase().replace(/-/g, "_");
  }
  if (userOrRole.role && typeof userOrRole.role === "string") {
    return userOrRole.role.toLowerCase().replace(/-/g, "_");
  }
  if (Array.isArray(userOrRole.roles) && userOrRole.roles.length > 0) {
    const isSuper = userOrRole.roles.some((r) => r.isSuperAdmin);
    if (isSuper) return "super_admin";
    const first = userOrRole.roles[0];
    const val = typeof first === "string" ? first : first.slug || first.name || "";
    return val.toLowerCase().replace(/-/g, "_");
  }
  return "staff";
}

/**
 * Returns default landing path for a given role
 */
export function getRoleDefaultRoute(role) {
  const norm = normalizeRole(role);
  return ROLE_DEFAULT_ROUTES[norm] || "/dashboard";
}

/**
 * Look up the access rule for a given pathname
 */
export function getRouteRequiredAccess(pathname) {
  if (!pathname) return null;
  return ROUTE_ACCESS_RULES.find((rule) => {
    return pathname === rule.prefix || pathname.startsWith(rule.prefix + "/");
  }) || null;
}

/**
 * Evaluate if the current user has access to a given route
 */
export function canAccessRoute(pathname, user) {
  if (!user) return false;
  const role = normalizeRole(user);

  // Super admin always has unrestricted access
  if (role === "super_admin" || user?.isSuperAdmin) {
    return true;
  }

  const rule = getRouteRequiredAccess(pathname);
  if (!rule) {
    // If it's a known app prefix without explicit restriction, allow authenticated user
    return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  // 1. Role verification
  if (rule.roles && rule.roles.length > 0) {
    if (!rule.roles.includes(role)) {
      return false;
    }
  }

  // 2. Permission verification (if user permissions are available)
  if (rule.permission && Array.isArray(user.permissions)) {
    if (user.permissions.length > 0 && !user.permissions.includes(rule.permission)) {
      return false;
    }
  }

  return true;
}

