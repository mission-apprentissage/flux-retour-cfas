const { Schema } = require("mongoose");

module.exports = new Schema({
  type: {
    type: String,
    default: null,
    description: "Le type de statistiques",
    unique: true,
  },
  date: {
    type: Date,
    default: () => new Date(),
    description: "La date du calcul de stats",
  },
  data: {
    type: Object,
    default: null,
    description: "Objet contenant les stats calculés",
  },
});
