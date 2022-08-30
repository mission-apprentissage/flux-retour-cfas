const Joi = require("joi");

const schema = Joi.string().min(1);

const validateNomApprenant = (value) => {
  return schema.validate(value);
};

const normalizeNomApprenant = (value) => {
  return typeof value === "string" ? value.toUpperCase().trim() : value;
};

module.exports = {
  schema,
  validateNomApprenant,
  normalizeNomApprenant,
};
