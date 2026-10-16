const catchAsync = require("../../utils/catchAsync");
const dashboardService = require("./dashboard.service");

const getSummary = catchAsync(async (req, res) => {
  const data = await dashboardService.getSummary(req.user, req.query);
  res.json({
    success: true,
    message: "Dashboard summary retrieved successfully",
    data,
  });
});

const getTodayAppointments = catchAsync(async (req, res) => {
  const data = await dashboardService.getTodayAppointments(req.user, req.query);
  res.json({
    success: true,
    message: "Today's appointments retrieved successfully",
    data,
  });
});

const getUpcomingAppointments = catchAsync(async (req, res) => {
  const data = await dashboardService.getUpcomingAppointments(req.user, req.query);
  res.json({
    success: true,
    message: "Upcoming appointments retrieved successfully",
    data,
  });
});

module.exports = {
  getSummary,
  getTodayAppointments,
  getUpcomingAppointments,
};
