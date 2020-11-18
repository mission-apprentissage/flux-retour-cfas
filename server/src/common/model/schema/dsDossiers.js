const { Schema } = require("mongoose");

module.exports = new Schema({
  dossier: {
    type: Object,
    required: true,
  },
  siren_present_catalogue: {
    type: Boolean,
    default: false,
    required: true,
  },
  siret_present_catalogue: {
    type: Boolean,
    default: false,
    required: true,
  },
  infos_api_entreprise: {
    type: Object,
    required: false,
  },
});
