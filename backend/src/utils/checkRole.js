const ApiError = require("./ApiError");

/**
 * Normalizes role name or slug for comparison (e.g. "Super Admin" -> "superadmin", "super-admin" -> "superadmin").
 */
function normalizeRole(role) {
  if (!role || typeof role !== "string") return "";
  return role.toLowerCase().replace(/[\s-_]/g, "");
}

/**
 * Extracts normalized role identifiers from a request or user object.
 *
 * @param {Object} reqOrUser - Express req or User document
 * @returns {string[]} Array of normalized role slugs/names
 */
function extractUserRoles(reqOrUser) {
  if (!reqOrUser) return [];

  const roleSet = new Set();

  // If req object with req.isSuperAdmin flag
  if (reqOrUser.isSuperAdmin) {
    roleSet.add("superadmin");
  }

  // If req object with req.roles array (populated by authenticate middleware)
  if (Array.isArray(reqOrUser.roles)) {
    for (const r of reqOrUser.roles) {
      if (typeof r === "string") {
        roleSet.add(normalizeRole(r));
      } else if (r && typeof r === "object") {
        if (r.slug) roleSet.add(normalizeRole(r.slug));
        if (r.name) roleSet.add(normalizeRole(r.name));
        if (r.isSuperAdmin) {
          roleSet.add("superadmin");
        }
      }
    }
  }

  // If user object or req.user with roleIds
  const user = reqOrUser.user || reqOrUser;
  if (user && Array.isArray(user.roleIds)) {
    for (const r of user.roleIds) {
      if (typeof r === "string") {
        roleSet.add(normalizeRole(r));
      } else if (r && typeof r === "object") {
        if (r.slug) roleSet.add(normalizeRole(r.slug));
        if (r.name) roleSet.add(normalizeRole(r.name));
        if (r.isSuperAdmin) {
          roleSet.add("superadmin");
        }
      }
    }
  }

  return Array.from(roleSet);
}

/**
 * Common function to check if a user or request matches any of the allowed roles.
 *
 * Dual Mode:
 * 1. Direct Helper:
 *    checkRole(req, "Super Admin", "Doctor") => returns boolean
 *    checkRole(user, "Doctor") => returns boolean
 *
 * 2. Express Route Middleware:
 *    router.post("/", checkRole("Super Admin"), handler)
 *
 * @param {Object|string} reqOrUser - Request, User, or first role string if used as middleware
 * @param {...string} allowedRoles - Role names or slugs to check against
 * @returns {boolean|Function} Boolean if checking directly, or middleware function if used in routes
 */
function checkRole(reqOrUser, ...allowedRoles) {
  // If first argument is a string, it was called as middleware factory: checkRole("Super Admin", "Doctor")
  if (typeof reqOrUser === "string") {
    const roles = [reqOrUser, ...allowedRoles];
    return (req, res, next) => {
      if (!req.user) return next(ApiError.unauthorized());
      if (checkRole(req, ...roles)) return next();
      return next(ApiError.forbidden("Access denied: insufficient role"));
    };
  }

  // Direct check mode: checkRole(reqOrUser, ...roles)
  if (!reqOrUser) return false;

  const userRoles = extractUserRoles(reqOrUser);
  const normalizedAllowed = allowedRoles.flat().map(normalizeRole);

  return normalizedAllowed.some((allowed) => {
    if (allowed === "superadmin" && (reqOrUser.isSuperAdmin || userRoles.includes("superadmin"))) {
      return true;
    }
    return userRoles.includes(allowed);
  });
}

module.exports = checkRole;
