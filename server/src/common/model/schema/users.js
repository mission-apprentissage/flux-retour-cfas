const { Schema } = require("mongoose");

module.exports = new Schema({
  username: {
    type: String,
    default: null,
    description: "Le nom de l'utilisateur",
    unique: true,
  },
  password: {
    type: String,
    default: null,
    description: "Le mot de passe hashé",
  },
  apiKey: {
    type: String,
    default: null,
    description: "La clé d'API si user API",
  },
  permissions: {
    type: [String],
    default: [],
    description: "Roles de l'utilisateur",
  },
});
