const { Schema } = require("mongoose");

const cfasAnnuaireSchema = new Schema({
  siret: {
    type: String,
    default: null,
    description: "Siret de l'établissement",
  },
  raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale de l'établissement",
  },
  uais: {
    type: [String],
    default: [],
    description: "Uais de l'établissement",
  },
  gestionnaire: {
    type: Boolean,
    default: false,
    description: "L'établissement est gestionnaire",
  },
  formateur: {
    type: Boolean,
    default: false,
    description: "L'établissement est formateur",
  },
  statut: {
    type: String,
    default: false,
    description: "Statut de l'établissement",
  },
  relations: {
    type: [
      new Schema(
        {
          siret: {
            type: String,
          },
          label: {
            type: String,
            default: undefined,
          },
          type: {
            type: String,
            enum: ["formateur", "gestionnaire"],
            default: undefined,
          },
        },
        { _id: false }
      ),
    ],
    default: [],
    description: "Relations de l'établissement",
  },
  adresse_label: {
    type: String,
    default: null,
    description: "Label de l'adresse",
  },
  adresse_code_postal: {
    type: String,
    default: null,
    description: "Code postal de l'adresse",
  },
  adresse_code_insee: {
    type: String,
    default: null,
    description: "Code INSEE de l'adresse",
  },
  adresse_region_code: {
    type: String,
    default: null,
    description: "Code région de l'adresse",
  },
  adresse_region_nom: {
    type: String,
    default: null,
    description: "Nom de la région de l'adresse",
  },
});

module.exports = cfasAnnuaireSchema;
