const ApiError = require("../utils/ApiError");

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.isSuperAdmin) return next();
    if (!req.permissions?.includes(permission)) {
      return next(ApiError.forbidden());
    }
    return next();
  };
}

const checkRole = require("../utils/checkRole");

function requireSuperAdmin(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  if (!checkRole(req, "Super Admin")) return next(ApiError.forbidden("Super Admin access required"));
  return next();
}

function requireVerified(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  return next();
}

module.exports = {
  requirePermission,
  requireSuperAdmin,
  requireVerified,
  checkRole,
  requireRole: checkRole,
};
