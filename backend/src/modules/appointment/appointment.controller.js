const { success } = require("../../utils/ApiResponse");
const appointmentService = require("./appointment.service");

async function book(req, res) {
  const appointment = await appointmentService.bookAppointment(req.body, req.user, req);
  return success(res, {
    message: "Appointment booked successfully",
    data: { appointment },
    status: 201,
  });
}

async function list(req, res) {
  const data = await appointmentService.listAppointments(req.query, req.user, req);
  return success(res, {
    message: "Appointments retrieved successfully",
    data,
  });
}

async function getById(req, res) {
  const appointment = await appointmentService.getAppointmentById(req.params.id, req.user, req);
  return success(res, {
    message: "Appointment details retrieved successfully",
    data: { appointment },
  });
}

async function update(req, res) {
  const appointment = await appointmentService.updateAppointment(
    req.params.id,
    req.body,
    req.user,
    req
  );
  return success(res, {
    message: "Appointment updated successfully",
    data: { appointment },
  });
}

async function cancel(req, res) {
  const appointment = await appointmentService.cancelAppointment(req.params.id, req.user, req);
  return success(res, {
    message: "Appointment cancelled successfully",
    data: { appointment },
  });
}

async function arrive(req, res) {
  const appointment = await appointmentService.markArrived(req.params.id, req.user, req);
  return success(res, {
    message: "Patient marked as arrived successfully",
    data: { appointment },
  });
}

async function complete(req, res) {
  const appointment = await appointmentService.markCompleted(
    req.params.id,
    req.body,
    req.user,
    req
  );
  return success(res, {
    message: "Appointment marked as completed successfully",
    data: { appointment },
  });
}

module.exports = {
  book,
  list,
  getById,
  update,
  cancel,
  arrive,
  complete,
};
