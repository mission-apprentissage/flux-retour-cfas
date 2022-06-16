const Joi = require("joi");

const validateCfd = (cfd) => {
  return Boolean(cfd) && cfdRegex.test(cfd);
};

const cfdRegex = /^[a-zA-Z0-9_]{8}$/;
const schema = Joi.string().regex(cfdRegex);

module.exports = {
  validateCfd,
  cfdRegex,
  schema,
};
