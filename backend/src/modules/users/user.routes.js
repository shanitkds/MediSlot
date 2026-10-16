const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { requirePermission } = require("../../middleware/requirePermission");
const controller = require("./user.controller");
const {
  createDoctorSchema,
  createReceptionistSchema,
  listSchema,
  idParamSchema,
  updateSchema,
  updateStatusSchema,
} = require("./user.validator");

const router = express.Router();

router.use(authenticate);

router.post("/doctors", requirePermission("users.create"), validate(createDoctorSchema), catchAsync(controller.createDoctor));
router.post("/receptionists", requirePermission("users.create"), validate(createReceptionistSchema), catchAsync(controller.createReceptionist));
router.get("/", requirePermission("users.view"), validate(listSchema), catchAsync(controller.list));
router.get("/:id", requirePermission("users.view"), validate(idParamSchema), catchAsync(controller.get));
router.patch("/:id/status", requirePermission("users.update"), validate(updateStatusSchema), catchAsync(controller.updateStatus));
router.patch("/:id", requirePermission("users.update"), validate(updateSchema), catchAsync(controller.update));
router.delete("/:id", requirePermission("users.delete"), validate(idParamSchema), catchAsync(controller.remove));

module.exports = router;
