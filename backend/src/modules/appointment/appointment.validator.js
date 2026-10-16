const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const bookAppointmentSchema = Joi.object({
  body: Joi.object({
    patientId: objectId.required().messages({
      "any.required": "patientId is required",
      "string.length": "patientId must be a valid 24-character hexadecimal ObjectId",
    }),
    doctorId: objectId.required().messages({
      "any.required": "doctorId is required",
      "string.length": "doctorId must be a valid 24-character hexadecimal ObjectId",
    }),
    slotId: objectId.required().messages({
      "any.required": "slotId is required",
      "string.length": "slotId must be a valid 24-character hexadecimal ObjectId",
    }),
    departmentId: objectId,
    purpose: Joi.string().trim().max(500).allow(""),
    notes: Joi.string().trim().max(2000).allow(""),
    appointmentDate: Joi.date().iso(),
  }).required(),
});

const listAppointmentsSchema = Joi.object({
  query: Joi.object({
    doctorId: objectId,
    patientId: objectId,
    status: Joi.string().valid("scheduled", "arrived", "completed", "cancelled"),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    search: Joi.string().trim().max(100),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sort: Joi.string(),
  }),
});

const idParamSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
});

const updateAppointmentSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    purpose: Joi.string().trim().max(500).allow(""),
    notes: Joi.string().trim().max(2000).allow(""),
    slotId: objectId,
  })
    .min(1)
    .required(),
});

const completeAppointmentSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    notes: Joi.string().trim().max(2000).allow(""),
  }),
});

module.exports = {
  bookAppointmentSchema,
  listAppointmentsSchema,
  idParamSchema,
  updateAppointmentSchema,
  completeAppointmentSchema,
};
