const Joi = require("joi");

const schema = Joi.string().min(1);

const validatePrenomApprenant = (value) => {
  return schema.validate(value);
};

const normalizePrenomApprenant = (value) => {
  return typeof value === "string" ? value.toUpperCase().trim() : value;
};

module.exports = {
  schema,
  validatePrenomApprenant,
  normalizePrenomApprenant,
};
