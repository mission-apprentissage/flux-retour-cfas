const { Schema } = require("mongoose");

module.exports = new Schema({
  ine_apprenant: {
    type: String,
    default: null,
    description: "N° INE du jeune",
    index: true,
  },
  statut_apprenant: {
    type: Number,
    default: null,
    description: "Statut apprenant",
  },
  uai_etablissement: {
    type: String,
    default: null,
    description: "UAI de l'établissement",
  },
  siret_etablissement: {
    type: String,
    default: null,
    description: "Siret de l'établissement",
  },
  formation_cfd: {
    type: String,
    default: null,
    description: "Code CFD de la formation",
  },
  annee_formation: {
    type: Number,
    default: null,
    description: "Numéro de l'année dans la formation (promo)",
  },
  periode_formation: {
    type: [Number],
    default: [],
    description: "Date debut & date de fin de la formation",
  },
  annee_scolaire: {
    type: String,
    description: 'Année scolaire sur laquelle le statut candidat est enregistré (ex: "2020-2021")',
  },
});
