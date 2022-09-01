const Joi = require("joi");

const SIRET_REGEX = /^[0-9]{14}$/;

const schema = Joi.string().length(14).pattern(SIRET_REGEX);

const validateSiret = (siret) => {
  return schema.required().validate(siret);
};

module.exports = {
  validateSiret,
  schema,
};
