const Joi = require("joi");

const CODE_COMMUNE_REGEX = /^([0-9]{2}|2A|2B)[0-9]{3}$/;

const schema = Joi.string().pattern(CODE_COMMUNE_REGEX);

const validateCodeCommune = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validateCodeCommune,
};
