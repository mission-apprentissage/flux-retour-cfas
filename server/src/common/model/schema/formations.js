const { Schema } = require("mongoose");

const formationSchema = new Schema(
  {
    cfd: {
      type: String,
      required: true,
      unique: true,
      description: "Code cfd de l'établissement",
    },
    libelle: {
      type: String,
      description: "Libellé normalisé depuis Tables de Correspondances",
    },
    niveau: {
      type: String,
      description: "Niveau récupéré depuis Tables de Correspondances",
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

module.exports = formationSchema;
