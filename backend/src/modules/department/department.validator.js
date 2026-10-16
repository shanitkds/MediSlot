const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createDepartmentSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).allow("").default(""),
    isActive: Joi.boolean().default(true),
  }).required(),
});

const listDepartmentSchema = Joi.object({
  query: Joi.object({
    search: Joi.string().allow(""),
    isActive: Joi.boolean(),
    sort: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
});

const idParamSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
});

const updateDepartmentSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow(""),
    isActive: Joi.boolean(),
  })
    .min(1)
    .required(),
});

module.exports = {
  createDepartmentSchema,
  listDepartmentSchema,
  idParamSchema,
  updateDepartmentSchema,
};
