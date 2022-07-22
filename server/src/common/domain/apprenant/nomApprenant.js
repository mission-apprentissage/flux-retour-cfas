const Joi = require("joi");

const schema = Joi.string().min(1);

const validateNomApprenant = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validateNomApprenant,
};
