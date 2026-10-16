const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createDoctorSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).when("userId", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    email: Joi.string().trim().email().lowercase().when("userId", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    password: Joi.string().min(8).max(128).when("userId", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    userId: objectId,
    departmentId: objectId.required(),
    specialization: Joi.string().trim().min(2).max(100).required(),
    consultationDuration: Joi.number().integer().min(5).max(180).default(15),
  }).required(),
});

const listDoctorSchema = Joi.object({
  query: Joi.object({
    search: Joi.string().allow(""),
    departmentId: objectId,
    specialization: Joi.string().allow(""),
    status: Joi.string().valid("active", "disabled"),
    sort: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
});

const idParamSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  query: Joi.object({
    permanent: Joi.boolean().truthy("true").falsy("false"),
    force: Joi.boolean().truthy("true").falsy("false"),
  }),
});

const updateDoctorSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    consultationDuration: Joi.number().integer().min(5).max(180),
    slotDurationMinutes: Joi.number().integer().min(5).max(180),
    specialization: Joi.string().trim().min(2).max(100),
    departmentId: objectId,
    status: Joi.string().valid("active", "disabled"),
  }).min(1).required(),
});

const updateSpecializationSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    specialization: Joi.string().trim().min(2).max(100).required(),
  }).required(),
});

const updateDepartmentSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    departmentId: objectId.required(),
  }).required(),
});

module.exports = {
  createDoctorSchema,
  listDoctorSchema,
  idParamSchema,
  updateDoctorSchema,
  updateSpecializationSchema,
  updateDepartmentSchema,
};
