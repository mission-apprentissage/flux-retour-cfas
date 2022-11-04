const Joi = require("joi");

const PASSWORD_MIN_LENGTH = 16;

const validatePassword = (password) => {
  return Boolean(password) && password.length >= PASSWORD_MIN_LENGTH;
};

const schema = Joi.string().min(PASSWORD_MIN_LENGTH);

module.exports = {
  validatePassword,
  schema,
};
