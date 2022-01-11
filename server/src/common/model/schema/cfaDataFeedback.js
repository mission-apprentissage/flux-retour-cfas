const { Schema } = require("mongoose");

module.exports = new Schema({
  siret: {
    type: String,
    description: "Siret de l'établissement",
  },
  uai: {
    type: String,
    required: true,
    description: "UAI de l'établissement",
  },
  email: {
    type: String,
    required: true,
    description: "Email de la personne ayant laissé le feedback",
  },
  details: {
    type: String,
    required: true,
    description: "Détails du feedback",
  },
  region_nom: {
    type: String,
    default: null,
    description: "Région de l'établissement",
  },
  region_num: {
    type: String,
    default: null,
    description: "Numéro de la région de l'établissement",
  },
  created_at: {
    type: Date,
    required: true,
    description: "Date à laquelle le feedback a été laissé",
  },
});
