const Joi = require("joi");

const NATURE_ORGANISME_DE_FORMATION = {
  RESPONSABLE: "responsable",
  FORMATEUR: "formateur",
  RESPONSABLE_FORMATEUR: "responsable_formateur",
  INCONNUE: "inconnue",
};

const schema = Joi.string().valid(...Object.values(NATURE_ORGANISME_DE_FORMATION));

const validateNatureOrganismeDeFormation = (value) => {
  return schema.validate(value);
};

module.exports = {
  schema,
  validateNatureOrganismeDeFormation,
  NATURE_ORGANISME_DE_FORMATION,
};
