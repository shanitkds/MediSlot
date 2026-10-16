const express = require("express");
const dashboardController = require("./dashboard.controller");
const { summarySchema, todayAppointmentsSchema, upcomingAppointmentsSchema } = require("./dashboard.validator");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { requirePermission } = require("../../middleware/requirePermission");

const router = express.Router();

router.use(authenticate);

// Permission middleware: all dashboard endpoints require 'dashboard.view'
router.get(
  "/summary",
  requirePermission("dashboard.view"),
  validate(summarySchema),
  dashboardController.getSummary
);

router.get(
  "/",
  requirePermission("dashboard.view"),
  validate(summarySchema),
  dashboardController.getSummary
);

router.get(
  "/appointments/today",
  requirePermission("dashboard.view"),
  validate(todayAppointmentsSchema),
  dashboardController.getTodayAppointments
);

router.get(
  "/appointments/upcoming",
  requirePermission("dashboard.view"),
  validate(upcomingAppointmentsSchema),
  dashboardController.getUpcomingAppointments
);

module.exports = router;
