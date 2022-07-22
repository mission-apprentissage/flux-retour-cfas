const Joi = require("joi");

// 123456789FF
const INE_RNIE_REGEX = /^[0-9_]{9}[a-zA-Z]{2}$/;
// 1234567890F
const INE_BEA_REGEX = /^[0-9_]{10}[a-zA-Z]{1}$/;
// 1234A12345F
const INE_APPRENTISSAGE_REGEX = /^[0-9_]{4}A[0-9_]{5}[a-zA-Z]{1}$/;

const schema = Joi.alternatives([
  Joi.string().pattern(INE_RNIE_REGEX, "INE RNIE"),
  Joi.string().pattern(INE_BEA_REGEX, "INE BEA"),
  Joi.string().pattern(INE_APPRENTISSAGE_REGEX, "INE Apprentissage"),
]);

const validateIneApprenant = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validateIneApprenant,
};
