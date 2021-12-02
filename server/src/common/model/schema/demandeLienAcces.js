const { Schema } = require("mongoose");

const demandeLienAcces = new Schema({
  nom_organisme: {
    type: String,
    required: true,
    default: null,
    description: "Nom de l'organisme faisant la demande",
  },
  uai_organisme: {
    type: String,
    required: true,
    default: null,
    description: "UAI de l'organisme faisant la demande",
  },
  code_postal_organisme: {
    type: String,
    required: true,
    default: null,
    description: "Code postal de l'organisme faisant la demande",
  },
  email_demandeur: {
    type: String,
    required: true,
    default: null,
    description: "Adresse email de la personne faisant la demande",
  },
  created_at: {
    type: Date,
    required: true,
    description: "Date à laquelle la demande a été effectuée",
  },
});

module.exports = demandeLienAcces;
