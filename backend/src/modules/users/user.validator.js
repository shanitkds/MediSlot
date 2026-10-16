const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const listSchema = Joi.object({
  query: Joi.object({
    search: Joi.string().allow(""),
    status: Joi.string().valid("active", "disabled"),
    isArchive: Joi.boolean(),
    roleId: objectId,
    sort: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
});

const createDoctorSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(128).required(),
    departmentId: objectId,
    specialization: Joi.string().trim().max(100),
    consultationDuration: Joi.number().integer().min(5).max(180),
  }).required(),
});

const createReceptionistSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }).required(),
});

const updateSchema = Joi.object({
  params: Joi.object({ id: objectId.required() }).required(),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    email: Joi.string().trim().email(),
    password: Joi.string().min(8).max(128),
    roleIds: Joi.array().items(objectId),
  }).min(1).required(),
});

const updateStatusSchema = Joi.object({
  params: Joi.object({ id: objectId.required() }).required(),
  body: Joi.object({
    status: Joi.string().valid("active", "disabled").required(),
  }).required(),
});

const idParamSchema = Joi.object({
  params: Joi.object({ id: objectId.required() }).required(),
});

module.exports = {
  listSchema,
  createDoctorSchema,
  createReceptionistSchema,
  updateSchema,
  updateStatusSchema,
  idParamSchema,
};
