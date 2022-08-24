const Joi = require("joi");

const schema = Joi.string().email();

const validateEmail = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validateEmail,
};
