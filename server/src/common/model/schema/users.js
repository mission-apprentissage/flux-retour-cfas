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
  password_update_token: {
    type: String,
    description: "Token généré afin de sécuriser le changement de mot de passe",
  },
  password_update_token_expiry: {
    type: Date,
    description: "Date d'expiration du token généré afin de sécuriser le changement de mot de passe",
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
