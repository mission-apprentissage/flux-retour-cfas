import Joi from "joi";
import { CODES_STATUT_APPRENANT } from "../../../constants/dossierApprenantConstants.js";

export const schema = Joi.number()
  .strict()
  .valid(CODES_STATUT_APPRENANT.apprenti, CODES_STATUT_APPRENANT.inscrit, CODES_STATUT_APPRENANT.abandon);

export const historiqueSchema = Joi.array().items({
  valeur_statut: schema.required(),
  date_statut: Joi.date().required(),
  date_reception: Joi.date().required(),
});

export const validateStatutApprenant = (value) => {
  const { error } = schema.validate(value);
  return !error;
};
