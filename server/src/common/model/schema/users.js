const { Schema } = require("mongoose");

module.exports = new Schema({
  username: {
    type: String,
    default: null,
    description: "Le nom de l'utilisateur",
    unique: true,
  },
  email: {
    type: String,
    default: null,
    description: "Email de l'utilisateur",
    unique: true,
  },
  password: {
    type: String,
    default: null,
    description: "Le mot de passe hashé",
  },
  network: {
    type: String,
    default: null,
    description: "Le réseau de l'utilisateur s'il est précisé",
  },
  permissions: {
    type: [String],
    default: [],
    description: "Roles de l'utilisateur",
  },
});
