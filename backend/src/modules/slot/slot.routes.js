const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { requirePermission } = require("../../middleware/requirePermission");
const catchAsync = require("../../utils/catchAsync");
const slotController = require("./slot.controller");
const {
  generateSlotsSchema,
  regenerateSlotsSchema,
  listSlotsSchema,
  idParamSchema,
  updateSlotSchema,
} = require("./slot.validator");

const router = express.Router();

router.use(authenticate);

// 1. POST /generate - Generate slots from a doctor's schedule for a specific date
router.post(
  "/generate",
  requirePermission("slots.create"),
  validate(generateSlotsSchema),
  catchAsync(slotController.generateSlots)
);

// 5. POST /regenerate - Regenerate slots after schedule changes
router.post(
  "/regenerate",
  requirePermission("slots.update"),
  validate(regenerateSlotsSchema),
  catchAsync(slotController.regenerateSlots)
);

// 2. GET / - List available and booked slots
router.get(
  "/",
  requirePermission("slots.view"),
  validate(listSlotsSchema),
  catchAsync(slotController.listSlots)
);

// 3. GET /:id - Check a specific slot's details and availability
router.get(
  "/:id",
  requirePermission("slots.view"),
  validate(idParamSchema),
  catchAsync(slotController.getSlotById)
);

// 4. PATCH /:id - Update slot status when needed
router.patch(
  "/:id",
  requirePermission("slots.update"),
  validate(updateSlotSchema),
  catchAsync(slotController.updateSlotStatus)
);

module.exports = router;
