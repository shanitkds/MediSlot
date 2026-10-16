import {
  normalizeRole,
  getRoleDefaultRoute,
  canAccessRoute,
  getRouteRequiredAccess,
} from "./routes";

describe("Route RBAC and Role Redirection", () => {
  describe("normalizeRole", () => {
    it("normalizes hyphenated roles", () => {
      expect(normalizeRole("super-admin")).toBe("super_admin");
      expect(normalizeRole({ role: "super-admin" })).toBe("super_admin");
      expect(normalizeRole({ roles: [{ slug: "super-admin", isSuperAdmin: true }] })).toBe(
        "super_admin"
      );
    });

    it("normalizes clinical roles", () => {
      expect(normalizeRole("Doctor")).toBe("doctor");
      expect(normalizeRole({ role: "Receptionist" })).toBe("receptionist");
      expect(normalizeRole({ roles: [{ slug: "doctor" }] })).toBe("doctor");
    });
  });

  describe("getRoleDefaultRoute", () => {
    it("returns correct landing routes for roles", () => {
      expect(getRoleDefaultRoute("super_admin")).toBe("/dashboard");
      expect(getRoleDefaultRoute("doctor")).toBe("/dashboard");
      expect(getRoleDefaultRoute("receptionist")).toBe("/dashboard");
      expect(getRoleDefaultRoute("member")).toBe("/profile");
    });
  });

  describe("canAccessRoute", () => {
    const superAdmin = { role: "super_admin", isSuperAdmin: true };
    const doctor = {
      role: "doctor",
      permissions: [
        "dashboard.view",
        "departments.view",
        "doctorschedule.view",
        "slots.view",
        "patients.view",
      ],
    };
    const receptionist = {
      role: "receptionist",
      permissions: [
        "dashboard.view",
        "doctors.view",
        "departments.view",
        "doctorschedule.view",
        "slots.view",
        "patients.view",
      ],
    };

    it("allows super admin unrestricted access to all routes", () => {
      expect(canAccessRoute("/users", superAdmin)).toBe(true);
      expect(canAccessRoute("/audit-logs", superAdmin)).toBe(true);
      expect(canAccessRoute("/doctors", superAdmin)).toBe(true);
      expect(canAccessRoute("/dashboard", superAdmin)).toBe(true);
    });

    it("prevents doctor from accessing admin-only routes like /users and /audit-logs", () => {
      expect(canAccessRoute("/users", doctor)).toBe(false);
      expect(canAccessRoute("/audit-logs", doctor)).toBe(false);
    });

    it("allows doctor to access their clinical routes", () => {
      expect(canAccessRoute("/dashboard", doctor)).toBe(true);
      expect(canAccessRoute("/departments", doctor)).toBe(true);
      expect(canAccessRoute("/schedules", doctor)).toBe(true);
      expect(canAccessRoute("/slots", doctor)).toBe(true);
      expect(canAccessRoute("/patients", doctor)).toBe(true);
    });

    it("prevents receptionist from accessing /users and /audit-logs", () => {
      expect(canAccessRoute("/users", receptionist)).toBe(false);
      expect(canAccessRoute("/audit-logs", receptionist)).toBe(false);
    });

    it("allows receptionist to access doctor directory and appointments", () => {
      expect(canAccessRoute("/doctors", receptionist)).toBe(true);
      expect(canAccessRoute("/patients", receptionist)).toBe(true);
      expect(canAccessRoute("/dashboard", receptionist)).toBe(true);
    });
  });
});
