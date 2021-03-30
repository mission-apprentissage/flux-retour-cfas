const { Schema } = require("mongoose");

const cfaDataFeedback = new Schema({
  siret: {
    type: String,
    required: true,
    description: "Siret de l'établissement",
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
  donnee_est_valide: {
    type: Boolean,
    required: true,
    description: "Les données présentées sur le tableau de bord par ce CFA est-elle valide",
  },
  created_at: {
    type: Date,
    required: true,
    description: "Date à laquelle le feedback a été laissé",
  },
});

module.exports = cfaDataFeedback;
