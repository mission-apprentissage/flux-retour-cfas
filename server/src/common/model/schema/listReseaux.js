const { Schema } = require("mongoose");

module.exports = new Schema({
  network: {
    type: String,
    default: null,
    description: "Liste des réseaux",
  },
});
