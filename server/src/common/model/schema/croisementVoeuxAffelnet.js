const { Schema } = require("mongoose");

const croisementVoeuxAffelnet = new Schema({
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
});

module.exports = croisementVoeuxAffelnet;
