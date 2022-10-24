const { Schema } = require("mongoose");

module.exports = new Schema({
  email: {
    type: String,
    default: null,
    description: "Email de l'utilisateur",
    unique: true,
    required: true,
  },

  password: {
    type: String,
    default: null,
    description: "Le mot de passe hashé",
  },
  password_update_token: {
    type: String,
    description: "Token généré afin de sécuriser le changement de mot de passe",
  },
  password_update_token_expiry: {
    type: Date,
    description: "Date d'expiration du token généré afin de sécuriser le changement de mot de passe",
  },
  password_updated_token_at: {
    type: Date,
  },
  password_updated_at: {
    type: Date,
  },

  role: {
    type: String,
    default: null,
    required: true,
  },
  uai: {
    type: String,
    default: null,
  },
  siret: {
    type: String,
    default: null,
  },
  nom: {
    type: String,
    default: null,
  },
  prenom: {
    type: String,
    default: null,
  },
  fonction: {
    type: String,
    default: null,
  },
  telephone: {
    type: String,
    default: null,
  },
  region: {
    type: String,
    default: null,
  },
  outils_gestion: {
    type: [String],
    default: [],
  },
  nom_etablissement: {
    type: String,
    default: null,
  },
  adresse_etablissement: {
    type: String,
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
