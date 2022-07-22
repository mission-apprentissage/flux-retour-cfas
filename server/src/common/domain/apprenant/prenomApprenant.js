const Joi = require("joi");

const schema = Joi.string().min(1);

const validatePrenomApprenant = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validatePrenomApprenant,
};
