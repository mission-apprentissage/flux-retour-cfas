const { Schema } = require("mongoose");

module.exports = new Schema({
  erp: {
    type: String,
    required: true,
    default: null,
    description: "Nom de l'ERP",
  },
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
  email_demandeur: {
    type: String,
    required: true,
    default: null,
    description: "Adresse email de la personne faisant la demande",
  },
  nb_apprentis: {
    type: String,
    default: null,
    description: "Nombre d'apprentis sur la dernière année",
  },
  created_at: {
    type: Date,
    required: true,
    description: "Date à laquelle la demande a été effectuée",
  },
});
