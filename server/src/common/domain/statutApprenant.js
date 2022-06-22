const Joi = require("joi");
const { CODES_STATUT_APPRENANT } = require("../constants/dossierApprenantConstants");

const schema = Joi.number()
  .strict()
  .valid(CODES_STATUT_APPRENANT.apprenti, CODES_STATUT_APPRENANT.inscrit, CODES_STATUT_APPRENANT.abandon);

const historiqueSchema = Joi.array().items({
  valeur_statut: schema.required(),
  date_statut: Joi.date().required(),
  date_reception: Joi.date().required(),
});

const validateStatutApprenant = (value) => {
  const { error } = schema.validate(value);
  return !error;
};

module.exports = {
  historiqueSchema,
  validateStatutApprenant,
  schema,
};
