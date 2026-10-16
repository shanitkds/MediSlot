const express = require("express");
const { authenticate } = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { requirePermission, checkRole } = require("../../middleware/requirePermission");
const catchAsync = require("../../utils/catchAsync");
const appointmentController = require("./appointment.controller");
const {
  bookAppointmentSchema,
  listAppointmentsSchema,
  idParamSchema,
  updateAppointmentSchema,
  completeAppointmentSchema,
} = require("./appointment.validator");

const router = express.Router();

router.use(authenticate);

// 1. POST / - Book an appointment
router.post("/",requirePermission("appointments.create"),validate(bookAppointmentSchema),catchAsync(appointmentController.book));

// 2. GET / - List, filter, sort, and paginate appointments
router.get("/",requirePermission("appointments.view"),validate(listAppointmentsSchema),catchAsync(appointmentController.list));

// 3. GET /:id - View appointment details
router.get("/:id",requirePermission("appointments.view"),validate(idParamSchema),catchAsync(appointmentController.getById));

// 4. PATCH /:id - Update purpose/notes or reschedule
router.patch("/:id",requirePermission("appointments.update"),validate(updateAppointmentSchema),catchAsync(appointmentController.update));

// 5. DELETE /:id - Cancel an appointment
router.delete(
  "/:id",
  (req, res, next) => {
    if (req.user && (req.isSuperAdmin || req.permissions?.includes("appointments.delete") || checkRole(req, "Doctor"))) {
      return next();
    }
    return requirePermission("appointments.delete")(req, res, next);
  },
  validate(idParamSchema),
  catchAsync(appointmentController.cancel)
);

// 6. POST /:id/arrive - Mark patient as arrived
router.post("/:id/arrive",requirePermission("appointments.update"),validate(idParamSchema),catchAsync(appointmentController.arrive));

// 7. POST /:id/complete - Mark appointment as completed
router.post("/:id/complete",requirePermission("appointments.update"),validate(completeAppointmentSchema),catchAsync(appointmentController.complete));

module.exports = router;
