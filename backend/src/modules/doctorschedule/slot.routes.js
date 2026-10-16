const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { requirePermission } = require("../../middleware/requirePermission");
const controller = require("./doctorschedule.controller");
const {
  configureScheduleSchema,
  getScheduleSchema,
  updateScheduleSchema,
} = require("./doctorschedule.validator");

const router = express.Router();

// Enforce authentication on all doctor schedule endpoints
router.use(authenticate);

// API 1: POST / - Configure working days, sessions, breaks, and slot duration (Super Admin)
router.post(
  "/",
  requirePermission("doctorschedule.create"),
  validate(configureScheduleSchema),
  catchAsync(controller.configureSchedule)
);

// API 2: GET / and GET /:doctorId - View the doctor's schedule (Super Admin, Doctor [own schedule])
router.get(
  "/",
  requirePermission("doctorschedule.view"),
  validate(getScheduleSchema),
  catchAsync(controller.getSchedule)
);

router.get(
  "/:doctorId",
  requirePermission("doctorschedule.view"),
  validate(getScheduleSchema),
  catchAsync(controller.getSchedule)
);

// API 3: PUT / and PUT /:doctorId - Update working days, sessions, breaks, and slot duration (Super Admin)
router.put(
  "/",
  requirePermission("doctorschedule.update"),
  validate(updateScheduleSchema),
  catchAsync(controller.updateSchedule)
);

router.put(
  "/:doctorId",
  requirePermission("doctorschedule.update"),
  validate(updateScheduleSchema),
  catchAsync(controller.updateSchedule)
);

module.exports = router;
