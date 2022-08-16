const { schema: ISO8601DateSchema } = require("../date");

const validateDateDeNaissanceApprenant = (value) => {
  return ISO8601DateSchema.validate(value);
};

module.exports = {
  validateDateDeNaissanceApprenant,
};
