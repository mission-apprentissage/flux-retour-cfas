const Joi = require("joi");
const { CODES_STATUT_APPRENANT } = require("../constants/dossierApprenantConstants");

const schema = Joi.number()
  .valid(CODES_STATUT_APPRENANT.apprenti, CODES_STATUT_APPRENANT.inscrit, CODES_STATUT_APPRENANT.abandon)
  .required();

const historiqueSchema = Joi.array().items({
  valeur_statut: schema.required(),
  date_statut: Joi.date().required(),
  date_reception: Joi.date().required(),
});

module.exports = {
  historiqueSchema,
  schema,
};
