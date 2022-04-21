const { Schema } = require("mongoose");

module.exports = new Schema({
  uai: {
    type: String,
    default: null,
    description: "UAI de l'établissement",
  },
  siret: {
    type: String,
    default: null,
    description: "Siret de l'établissement",
  },
  email_contact: {
    type: String,
    default: null,
    description: "Email de contact rattaché au cfa",
  },
  email_contact_confirme: {
    type: Boolean,
    default: false,
    description: "Indique si l'email de contact rattaché au cfa a été confirmé",
  },
  sources: {
    type: [String],
    default: [],
    description: "Liste des sources des contacts",
  },
});
