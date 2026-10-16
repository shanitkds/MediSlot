const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middleware/validate");
const { authenticate, optionalAuthenticate } = require("../../middleware/authenticate");
const { authLimiter } = require("../../middleware/rateLimit");
const controller = require("./auth.controller");
const {
  loginSchema,
  emailSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("./auth.validator");

const router = express.Router();

router.post("/login", authLimiter, validate(loginSchema), catchAsync(controller.login));
router.post("/refresh", catchAsync(controller.refresh));
router.post("/logout", optionalAuthenticate, catchAsync(controller.logout));
router.get("/me", authenticate, catchAsync(controller.me));
router.post("/forgot-password", authLimiter, validate(emailSchema), catchAsync(controller.forgotPassword));
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), catchAsync(controller.resetPassword));
router.post("/change-password", authenticate, validate(changePasswordSchema), catchAsync(controller.changePassword));

module.exports = router;
