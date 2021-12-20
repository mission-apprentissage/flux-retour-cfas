const { Schema } = require("mongoose");

module.exports = new Schema({
  profil: {
    type: String,
  },
  region: {
    type: String,
  },
  email: {
    type: String,
  },
  created_at: {
    type: Date,
  },
});
