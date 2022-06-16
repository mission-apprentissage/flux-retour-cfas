const { Schema } = require("mongoose");

module.exports = new Schema({
  nom_reseau: {
    type: String,
    default: null,
    description: "Nom du réseau de cfas",
  },
  nom_etablissement: {
    type: String,
    default: null,
    description: "Nom de l'établissement",
  },
  uai: {
    type: String,
    default: null,
    description: "Code uai de l'établissement",
  },
  siret: {
    type: String,
    default: null,
    description: "Siret de l'établissement",
  },
  updated_at: {
    type: Date,
    default: null,
    description: "Date de mise à jour en base de données",
  },
  created_at: {
    type: Date,
    description: "Date d'ajout en base de données",
  },
});
