import Joi from "joi";

import { uaiSchema } from "@/common/utils/validationUtils";
import { schema as anneeScolaireSchema } from "@/common/validation/utils/anneeScolaire";
import { schema as nomApprenantSchema } from "@/common/validation/utils/apprenant/nomApprenant";
import { schema as prenomApprenantSchema } from "@/common/validation/utils/apprenant/prenomApprenant";
import { schema as statutApprenantSchema } from "@/common/validation/utils/apprenant/statutApprenant";
import { schema as cfdSchema } from "@/common/validation/utils/cfd";
import { schema as ISO8601DateSchema } from "@/common/validation/utils/date";
import { schema as siretSchema } from "@/common/validation/utils/siret";

/**
 * @deprecated
 * Note: ce schema Joi est déprécié, et utilisé uniquement par l'API V1
 * La V2 utilise Zod, qui permet le typing et la generation de la doc openAPI
 */
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
