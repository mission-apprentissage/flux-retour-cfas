const { Schema } = require("mongoose");

module.exports = new Schema({
  email: {
    type: String,
    default: null,
    description: "Email de l'utilisateur",
    unique: true,
    required: true,
  },
  updated_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    required: true,
  },
});
