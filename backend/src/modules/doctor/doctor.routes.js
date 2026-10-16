const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { requireSuperAdmin, requirePermission } = require("../../middleware/requirePermission");
const controller = require("./doctor.controller");
const {
  createDoctorSchema,
  listDoctorSchema,
  idParamSchema,
  updateDoctorSchema,
  updateSpecializationSchema,
  updateDepartmentSchema,
} = require("./doctor.validator");

const router = express.Router();

router.use(authenticate);

router.post("/",requireSuperAdmin,validate(createDoctorSchema),catchAsync(controller.create));
router.get("/",requirePermission("doctors.view"),validate(listDoctorSchema),catchAsync(controller.list));
router.get("/:id",requirePermission("doctors.view"),validate(idParamSchema),catchAsync(controller.get));
router.patch("/:id",requirePermission("doctors.update"),validate(updateDoctorSchema),catchAsync(controller.update));
router.patch("/:id/specialization",requireSuperAdmin,validate(updateSpecializationSchema),catchAsync(controller.updateSpecialization));
router.patch("/:id/department",requireSuperAdmin,validate(updateDepartmentSchema),catchAsync(controller.updateDepartment));
router.delete("/:id",requireSuperAdmin,validate(idParamSchema),catchAsync(controller.deactivate));

module.exports = router;
