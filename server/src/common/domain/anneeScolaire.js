const Joi = require("joi");

const schema = Joi.string()
  .regex(/^\d{4}-\d{4}$/)
  .required();

const validateAnneeScolaire = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validateAnneeScolaire,
};
