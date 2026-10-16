const { success } = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");
const doctorScheduleService = require("./doctorschedule.service");

/**
 * API 1: Configure working days, sessions, breaks, and slot duration (Super Admin).
 */
async function configureSchedule(req, res) {
  const schedule = await doctorScheduleService.configureSchedule(req.body, req.user, req);
  return success(res, {
    message: "Doctor schedule configured successfully",
    data: { schedule },
    status: 201,
  });
}

/**
 * API 2: View the doctor's schedule (Super Admin, Doctor [own schedule]).
 */
async function getSchedule(req, res) {
  const queryOrParams = {
    doctorId: req.params.doctorId || req.query.doctorId,
  };
  const result = await doctorScheduleService.getSchedule(queryOrParams, req.user, req);

  const data = Array.isArray(result) ? { schedules: result } : { schedule: result };
  return success(res, {
    message: "Doctor schedule retrieved successfully",
    data,
  });
}

/**
 * API 3: Update working days, sessions, breaks, and slot duration (Super Admin).
 */
async function updateSchedule(req, res) {
  const doctorId = req.params.doctorId || req.body.doctorId || req.query.doctorId;
  if (!doctorId) {
    throw ApiError.badRequest("doctorId is required in URL parameter, query, or request body");
  }

  const schedule = await doctorScheduleService.updateSchedule(doctorId, req.body, req.user, req);
  return success(res, {
    message: "Doctor schedule updated successfully",
    data: { schedule },
  });
}

module.exports = {
  configureSchedule,
  getSchedule,
  updateSchedule,
};
