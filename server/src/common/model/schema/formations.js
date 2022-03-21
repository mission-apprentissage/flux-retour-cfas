const { Schema } = require("mongoose");

module.exports = new Schema(
  {
    cfd: {
      type: String,
      required: true,
      unique: true,
      description: "Code cfd de l'établissement",
    },
    cfd_start_date: {
      type: Date,
      default: null,
      description: "Date d'ouverture du CFD",
    },
    cfd_end_date: {
      type: Date,
      default: null,
      description: "Date de fermeture du CFD",
    },
    libelle: {
      type: String,
      description: "Libellé normalisé depuis Tables de Correspondances",
    },
    niveau: {
      type: String,
      description: "Niveau de formation récupéré via Tables de Correspondances",
    },
    niveau_libelle: {
      type: String,
      description: "Libellé du niveau de formation récupéré via Tables de Correspondances",
    },
    tokenized_libelle: {
      type: String,
      description: "Libellé tokenizé pour la recherche",
    },
    metiers: {
      type: [String],
      default: [],
      description: "Les domaines métiers rattachés à la formation",
    },
    updated_at: {
      type: Date,
      default: null,
      description: "Date d'update en base de données",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "Date d'ajout en base de données",
    },
  },
  { versionKey: false } // don't add automatic Mongoose __v field
);
