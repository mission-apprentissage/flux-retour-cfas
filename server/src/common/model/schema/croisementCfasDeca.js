const { Schema } = require("mongoose");

const croisementCfasDecaSchema = new Schema({
  uai: {
    type: String,
    default: null,
    description: "UAI de l'établissement",
  },
  deca_nom_etablissement: {
    type: String,
    default: null,
    description: "Nom de l'établissement dans le fichier DECA",
  },
  tdb_nom_etablissement: {
    type: String,
    default: null,
    description: "Nom de l'établissement dans le Tdb",
  },
  nb_contrats_deca_2021: {
    type: Number,
    default: null,
    description: "Nombre de contrats pour l'établissement dans fichier DECA à fin 2021",
  },
  nb_contrats_tdb_2021: {
    type: Number,
    default: null,
    description: "Nombre de contrats pour l'établissement dans le tableau de bord à date du jour",
  },
  uai_missing_in_tdb: {
    type: Boolean,
    default: false,
    description: "Indique si l'uai est manquant dans le Tdb",
  },
});

module.exports = croisementCfasDecaSchema;
