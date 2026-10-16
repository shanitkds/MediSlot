const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const generateSlotsSchema = Joi.object({
  body: Joi.object({
    doctorId: objectId.required().messages({
      "any.required": "doctorId is required",
      "string.length": "doctorId must be a valid 24-character hexadecimal ObjectId",
    }),
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        "any.required": "date is required",
        "string.pattern.base": "date must be in YYYY-MM-DD format",
      }),
  }).required(),
});

const listSlotsSchema = Joi.object({
  query: Joi.object({
    doctorId: objectId,
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    status: Joi.string().valid("available", "booked"),
    onlyFuture: Joi.boolean().truthy("true", "1").falsy("false", "0"),
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

const updateSlotSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    status: Joi.string().valid("available", "booked").required(),
  }).required(),
});

module.exports = {
  generateSlotsSchema,
  regenerateSlotsSchema: generateSlotsSchema,
  listSlotsSchema,
  idParamSchema,
  updateSlotSchema,
};

