const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeSlotItem = Joi.object({
  startTime: Joi.string().pattern(timePattern).required().messages({
    "string.pattern.base": "startTime must be in HH:mm format (e.g. 09:00)",
  }),
  endTime: Joi.string().pattern(timePattern).required().messages({
    "string.pattern.base": "endTime must be in HH:mm format (e.g. 17:00)",
  }),
});

const configureScheduleSchema = Joi.object({
  body: Joi.object({
    doctorId: objectId.required().messages({
      "any.required": "doctorId is required",
      "string.length": "doctorId must be a valid 24-character hexadecimal ObjectId",
    }),
    workingDays: Joi.array()
      .items(Joi.number().integer().min(0).max(7))
      .unique()
      .min(1)
      .default([1, 2, 3, 4, 5]),
    sessions: Joi.array().items(timeSlotItem).min(1).required().messages({
      "any.required": "sessions are required",
      "array.min": "At least one session is required",
    }),
    breaks: Joi.array().items(timeSlotItem).default([]),
    slotDurationMinutes: Joi.number().integer().min(5).max(240).default(15),
  }).required(),
});

const getScheduleSchema = Joi.object({
  params: Joi.object({
    doctorId: objectId,
  }),
  query: Joi.object({
    doctorId: objectId,
  }),
});

const updateScheduleSchema = Joi.object({
  params: Joi.object({
    doctorId: objectId,
  }),
  query: Joi.object({
    doctorId: objectId,
  }),
  body: Joi.object({
    doctorId: objectId,
    workingDays: Joi.array()
      .items(Joi.number().integer().min(0).max(7))
      .unique()
      .min(1),
    sessions: Joi.array().items(timeSlotItem).min(1),
    breaks: Joi.array().items(timeSlotItem),
    slotDurationMinutes: Joi.number().integer().min(5).max(240),
  })
    .min(1)
    .required(),
});

module.exports = {
  configureScheduleSchema,
  getScheduleSchema,
  updateScheduleSchema,
};
