const { Schema } = require("mongoose");

module.exports = new Schema({
  username: {
    type: String,
    default: null,
    description: "Le nom de l'utilisateur",
  },
  user_organisme: {
    type: String,
    default: null,
    description: "L'organisme de l'utilisateur",
  },
  user_region: {
    type: String,
    default: null,
    description: "La région de l'utilisateur",
  },
  user_network: {
    type: String,
    default: null,
    description: "Le réseau de l'utilisateur",
  },
  date: {
    type: Date,
    required: true,
    description: "La date de l'evenement",
  },
  type: {
    type: String,
    default: null,
    description: "Le type d'action",
  },
  action: {
    type: String,
    default: null,
    description: "L'action ayant eu lieu",
  },
  data: {
    type: Object,
    default: null,
    description: "La donnée liéé à l'action",
  },
});
