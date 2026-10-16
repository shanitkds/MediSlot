const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { requirePermission } = require("../../middleware/requirePermission");
const controller = require("./patient.controller");
const {
  createPatientSchema,
  listPatientSchema,
  idParamSchema,
  updatePatientSchema,
} = require("./patient.validator");

const router = express.Router();

router.use(authenticate);

router.post("/", requirePermission("patients.create"), validate(createPatientSchema), catchAsync(controller.create));
router.get("/", requirePermission("patients.view"), validate(listPatientSchema), catchAsync(controller.list));
router.get("/:id", requirePermission("patients.view"), validate(idParamSchema), catchAsync(controller.get));
router.patch("/:id", requirePermission("patients.update"), validate(updatePatientSchema), catchAsync(controller.update));
router.delete("/:id", requirePermission("patients.delete"), validate(idParamSchema), catchAsync(controller.deactivate));

module.exports = router;
