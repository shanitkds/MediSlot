const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { requirePermission } = require("../../middleware/requirePermission");
const controller = require("./department.controller");
const {
  createDepartmentSchema,
  listDepartmentSchema,
  idParamSchema,
  updateDepartmentSchema,
} = require("./department.validator");

const router = express.Router();

router.use(authenticate);

router.post("/", requirePermission("departments.create"), validate(createDepartmentSchema), catchAsync(controller.create));
router.get("/", requirePermission("departments.view"), validate(listDepartmentSchema), catchAsync(controller.list));
router.get("/:id", requirePermission("departments.view"), validate(idParamSchema), catchAsync(controller.get));
router.patch("/:id", requirePermission("departments.update"), validate(updateDepartmentSchema), catchAsync(controller.update));
router.delete("/:id", requirePermission("departments.delete"), validate(idParamSchema), catchAsync(controller.deleteOrDeactivate));

module.exports = router;
