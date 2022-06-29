const { Schema } = require("mongoose");

module.exports = new Schema({
  dossierApprenantId: {
    type: String,
    default: null,
    description: "Identifiant du dossier apprenant d'origine",
  },
  uai_etablissement: {
    type: String,
    default: null,
    description: "Code uai de l'établissement d'origine",
    index: true,
    sparse: true,
  },
  nom_etablissement: {
    type: String,
    default: null,
    description: "Nom de l'établissement d'origine",
  },
  etablissement_code_postal: {
    type: String,
    default: null,
    description: "Code postal établissement",
  },
  formation_cfd: {
    type: String,
    default: null,
    description: "CFD de la formation du dossierApprenant",
    index: true,
  },
  periode_formation: {
    type: [Number],
    default: [],
    description: "Date debut & date de fin de la formation",
  },
  annee_formation: {
    type: Number,
    default: null,
    description: "Numéro de l'année dans la formation (promo)",
  },
  annee_scolaire: {
    type: String,
    description: 'Année scolaire sur laquelle le dossierApprenant est enregistré (ex: "2020-2021")',
  },
  code_commune_insee_apprenant: {
    type: String,
    default: null,
    description: "Code commune insee du jeune",
  },
  date_de_naissance_apprenant: {
    type: Date,
    default: null,
    description: "Date de naissance du jeune",
  },
  contrat_date_debut: {
    type: Date,
    default: null,
    description: "Date de début du contrat",
  },
  contrat_date_fin: {
    type: Date,
    default: null,
    description: "Date de fin du contrat",
  },
  contrat_date_rupture: {
    type: Date,
    default: null,
    description: "Date de rupture du contrat",
  },
  formation_rncp: {
    type: String,
    default: null,
    description: "Code RNCP de la formation du dossierApprenant",
  },
  indicateur_effectif: {
    type: String,
    default: null,
    description: "Indicateur lié au dossierApprenant",
  },
  updated_at: {
    type: Date,
    default: null,
    description: "Date d'ajout en base de données",
  },
  created_at: {
    type: Date,
    description: "Date d'ajout en base de données",
  },
});
