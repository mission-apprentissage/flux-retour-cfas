const { Schema } = require("mongoose");

const rcoStatutsCandidatsSchema = new Schema({
  statutCandidatId: {
    type: String,
    default: null,
    description: "Identifiant du statut d'origine",
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
  etablissement_formateur_code_commune_insee: {
    type: String,
    default: null,
    description: "Code commune de l'établissement formateur",
  },
  statut_apprenant: {
    type: Number,
    default: null,
    description: "Statut de l'apprenant",
    index: true,
  },
  formation_cfd: {
    type: String,
    default: null,
    description: "CFD de la formation du candidat",
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
    description: 'Année scolaire sur laquelle le statut candidat est enregistré (ex: "2020-2021")',
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
    description: "Code RNCP de la formation du candidat",
  },
  updated_at: {
    type: Date,
    default: null,
    description: "Date d'ajout en base de données",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
});

module.exports = rcoStatutsCandidatsSchema;
