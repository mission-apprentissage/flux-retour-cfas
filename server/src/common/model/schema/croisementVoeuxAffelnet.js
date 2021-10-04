const { Schema } = require("mongoose");

const croisementVoeuxAffelnet = new Schema({
  ine_apprenant: {
    type: String,
    default: null,
    description: "N° INE du jeune",
    index: true,
  },
  status_apprenant: {
    type: Number,
    default: null,
    description: "Status apprenant",
  },
});

module.exports = croisementVoeuxAffelnet;
