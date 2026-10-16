const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createPatientSchema = Joi.object({
  body: Joi.object({
    patientId: Joi.string().trim().uppercase().min(2).max(50),
    name: Joi.string().trim().min(2).max(100).required(),
    mobile: Joi.string().trim().min(5).max(20).required(),
    dateOfBirth: Joi.date().max("now").required(),
    gender: Joi.string().trim().valid("male", "female", "other").insensitive().required(),
    isActive: Joi.boolean().default(true),
    status: Joi.string().valid("active", "inactive").default("active"),
  }).required(),
});

const listPatientSchema = Joi.object({
  query: Joi.object({
    patientId: Joi.string().trim().allow(""),
    name: Joi.string().trim().allow(""),
    mobile: Joi.string().trim().allow(""),
    search: Joi.string().trim().allow(""),
    isActive: Joi.boolean(),
    status: Joi.string().valid("active", "inactive"),
    sort: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
});

const idParamSchema = Joi.object({
  params: Joi.object({
    id: Joi.alternatives().try(objectId, Joi.string().trim().min(2)).required(),
  }).required(),
});

const updatePatientSchema = Joi.object({
  params: Joi.object({
    id: Joi.alternatives().try(objectId, Joi.string().trim().min(2)).required(),
  }).required(),
  body: Joi.object({
    patientId: Joi.string().trim().uppercase().min(2).max(50),
    name: Joi.string().trim().min(2).max(100),
    mobile: Joi.string().trim().min(5).max(20),
    dateOfBirth: Joi.date().max("now"),
    gender: Joi.string().trim().valid("male", "female", "other").insensitive(),
    isActive: Joi.boolean(),
    status: Joi.string().valid("active", "inactive"),
  })
    .min(1)
    .required(),
});

module.exports = {
  createPatientSchema,
  listPatientSchema,
  idParamSchema,
  updatePatientSchema,
};
