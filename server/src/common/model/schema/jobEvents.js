const { Schema } = require("mongoose");

module.exports = new Schema({
  jobname: {
    type: String,
    default: null,
    required: true,
    description: "Le nom du job",
  },
  date: {
    type: Date,
    default: () => new Date(),
    description: "La date de l'evenement",
  },
  action: {
    type: String,
    default: null,
    required: true,
    description: "L'action ayant eu lieu",
  },
  data: {
    type: Object,
    default: null,
    description: "La donnée liéé à l'action",
  },
});
