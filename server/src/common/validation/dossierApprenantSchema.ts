import Joi from "joi";

import { schema as anneeScolaireSchema } from "./utils/anneeScolaire.js";
import { schema as ISO8601DateSchema } from "./utils/date.js";
import { schema as statutApprenantSchema } from "./utils/apprenant/statutApprenant.js";
import { uaiSchema } from "../../common/utils/validationUtils.js";
import { schema as cfdSchema } from "./utils/cfd.js";
import { schema as nomApprenantSchema } from "./utils/apprenant/nomApprenant.js";
import { schema as prenomApprenantSchema } from "./utils/apprenant/prenomApprenant.js";
import { schema as siretSchema } from "./utils/siret.js";

const dossierApprenantSchema = Joi.object({
  // required fields
  nom_apprenant: nomApprenantSchema.required().trim(),
  prenom_apprenant: prenomApprenantSchema.required().trim(),
  date_de_naissance_apprenant: ISO8601DateSchema.required(),
  uai_etablissement: uaiSchema().required(),
  nom_etablissement: Joi.string().required(),
  id_formation: cfdSchema.required(),
  annee_scolaire: anneeScolaireSchema.required(),
  statut_apprenant: statutApprenantSchema.required(),
  date_metier_mise_a_jour_statut: ISO8601DateSchema.required(),
  id_erp_apprenant: Joi.string().required(),

  // optional
  ine_apprenant: Joi.string().allow(null, ""),
  email_contact: Joi.string().allow(null, ""),
  tel_apprenant: Joi.string().allow(null, ""),
  code_commune_insee_apprenant: Joi.string().allow(null),

  siret_etablissement: siretSchema.allow(null, ""),

  libelle_long_formation: Joi.string().allow(null, ""),
  periode_formation: Joi.string().allow(null, ""),
  annee_formation: Joi.number().allow(null),
  formation_rncp: Joi.string().allow(null, ""),

  contrat_date_debut: ISO8601DateSchema.allow(null),
  contrat_date_fin: ISO8601DateSchema.allow(null),
  contrat_date_rupture: ISO8601DateSchema.allow(null),
});

export default dossierApprenantSchema;
