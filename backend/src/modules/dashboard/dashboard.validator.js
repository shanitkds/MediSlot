const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const summarySchema = Joi.object({
  query: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    doctorId: objectId,
    role: Joi.string().valid("super_admin", "doctor", "receptionist", "Super Admin", "Doctor", "Receptionist"),
  }),
});

const todayAppointmentsSchema = Joi.object({
  query: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    groupBy: Joi.string().valid("status", "time", "none").default("none"),
    doctorId: objectId,
    departmentId: objectId,
    status: Joi.string().valid("scheduled", "arrived", "completed", "cancelled"),
  }),
});

const upcomingAppointmentsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    doctorId: objectId,
    departmentId: objectId,
    status: Joi.string().valid("scheduled", "arrived", "completed", "cancelled"),
    includeCancelled: Joi.boolean().default(false),
  }),
});

module.exports = {
  summarySchema,
  todayAppointmentsSchema,
  upcomingAppointmentsSchema,
};
