const { Schema } = require("mongoose");

module.exports = new Schema({
  user_email: {
    type: String,
    default: null,
    description: "Email de l'utilisateur",
    unique: true,
    required: true,
  },
  user_uai: {
    type: String,
    default: null,
    required: true,
  },
  user_siret: {
    type: String,
    default: null,
    required: true,
  },
  user_nom_etablissement: {
    type: String,
    default: null,
  },
  cfd: {
    type: String,
    default: null,
  },
  code_rncp: {
    type: String,
    default: null,
  },
  annee_scolaire: {
    type: String,
    default: null,
  },
  annee_formation: {
    type: Number,
    default: null,
  },
  nom_apprenant: {
    type: String,
    default: null,
  },
  prenom_apprenant: {
    type: String,
    default: null,
  },
  date_de_naissance_apprenant: {
    type: Date,
  },
  telephone_apprenant: {
    type: String,
    default: null,
  },
  email_apprenant: {
    type: String,
    default: null,
  },
  ine_apprenant: {
    type: String,
    default: null,
  },
  code_commune_insee_apprenant: {
    type: String,
    default: null,
  },
  date_inscription: {
    type: Date,
    default: null,
  },
  date_fin_formation: {
    type: Date,
    default: null,
  },
  date_debut_contrat: {
    type: Date,
    default: null,
  },
  date_fin_contrat: {
    type: Date,
    default: null,
  },
  date_rupture_contrat: {
    type: Date,
    default: null,
  },
  date_sortie_formation: {
    type: Date,
    default: null,
  },

  updated_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    required: true,
  },
});
