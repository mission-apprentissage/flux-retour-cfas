import Joi from "joi";
import { CODES_STATUT_APPRENANT } from "../../../constants/dossierApprenantConstants.js";

export const schema = Joi.number()
  .strict()
  .valid(CODES_STATUT_APPRENANT.apprenti, CODES_STATUT_APPRENANT.inscrit, CODES_STATUT_APPRENANT.abandon);
