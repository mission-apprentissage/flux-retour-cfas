const Joi = require("joi");

const { schema: uaiSchema } = require("../domain/uai");

// TODO Vérifier les règles métiers des champs avec Raphaelle
const schema = Joi.object({
  dossierApprenant_id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/) // Object id regex
    .required(),
  uai_etablissement: uaiSchema.required(),
  etablissement_formateur_uai: uaiSchema.required(),
  statut_apprenant: Joi.string().required(),
  nom_apprenant: Joi.string().required(),
  prenom_apprenant: Joi.string().required(),
  date_de_naissance_apprenant: Joi.date().required(),

  formation_rncp: Joi.string().allow(null, ""),
  code_commune_insee_apprenant: Joi.string().allow(null),
  tel_apprenant: Joi.string().allow(null, ""),
  email_contact: Joi.string().allow(null, ""),
  date_entree_formation: Joi.date().allow(null),
  contrat_date_debut: Joi.date().allow(null),
  contrat_date_rupture: Joi.date().allow(null),
});

module.exports = { schema };
