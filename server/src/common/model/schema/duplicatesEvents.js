const { Schema } = require("mongoose");

module.exports = new Schema({
  date: {
    type: Date,
    default: () => new Date(),
    description: "La date de l'evenement",
  },
  jobType: {
    type: String,
    default: null,
    description: "Le type de job",
  },
  args: {
    type: Object,
    default: null,
    description: "L'action ayant eu lieu",
  },
  duplicatesInfo: {
    type: Object,
    default: null,
    description: "Les données des doublons",
  },
  data: {
    type: Object,
    default: null,
    description: "Contenu des doublons",
  },
});
