const Joi = require("joi");
const pick = require("lodash.pick");
const { schema: uaiSchema } = require("../domain/uai");

const SIFA_FIELDS = [
  "uai_etablissement",
  // "etablissement_formateur_uai", // Todo Check avec raphaelle
  // "statut_apprenant", // Todo Check avec raphaelle
  "nom_apprenant",
  "prenom_apprenant",
  "date_de_naissance_apprenant",
  "formation_rncp",
  "code_commune_insee_apprenant",
  "tel_apprenant",
  "email_contact",
  "date_entree_formation",
  "contrat_date_debut",
  "contrat_date_rupture",
];

// TODO Vérifier les règles métiers des champs avec Raphaelle
const schema = Joi.object({
  dossierApprenant_id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/) // Object id regex
    .required(),
  uai_etablissement: uaiSchema.required(),
  // etablissement_formateur_uai: uaiSchema.required(), // Todo Check avec raphaelle
  // statut_apprenant: Joi.string().required(), // Todo Check avec raphaelle
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

const dossiersApprenantSifaProjection = SIFA_FIELDS.reduce((acc, item) => ({ ...acc, [item]: 1 }), {});

const mapToDonneeSifa = (props) => pick(props, SIFA_FIELDS);

module.exports = { schema, dossiersApprenantSifaProjection, mapToDonneeSifa };
