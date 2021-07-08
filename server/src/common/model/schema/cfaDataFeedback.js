const { Schema } = require("mongoose");

const cfaDataFeedback = new Schema({
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
  created_at: {
    type: Date,
    required: true,
    description: "Date à laquelle le feedback a été laissé",
  },
});

module.exports = cfaDataFeedback;
