import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";

export const navItems = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.appointments, label: "Appointments", permission: PERMISSIONS.APPOINTMENTS_VIEW },
  { href: ROUTES.users, label: "Users", permission: PERMISSIONS.USERS_VIEW },
  { href: ROUTES.roles, label: "Roles", permission: PERMISSIONS.ROLES_VIEW },
  { href: ROUTES.notifications, label: "Notifications" },
  { href: ROUTES.auditLogs, label: "Audit logs", permission: PERMISSIONS.AUDIT_VIEW },
  { href: ROUTES.application, label: "Settings", permission: PERMISSIONS.SETTINGS_VIEW },
];

export const settingsNav = [
  { href: ROUTES.profile, label: "Profile" },
  { href: ROUTES.security, label: "Security" },
  { href: ROUTES.application, label: "Application", permission: PERMISSIONS.SETTINGS_VIEW },
  { href: ROUTES.permissions, label: "Permissions", permission: PERMISSIONS.PERMISSIONS_VIEW },
];
