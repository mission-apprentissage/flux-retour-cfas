const { Schema } = require("mongoose");

module.exports = new Schema({
  annuaire_siret_responsable: {
    type: String,
    default: null,
    description: "Siret responsable dans l'annuaire de l'établissement",
  },
  annuaire_siret_formateur: {
    type: String,
    default: null,
    description: "Siret formateur dans l'annuaire de l'établissement",
  },
  annuaire_uai: {
    type: String,
    default: null,
    description: "UAI dans l'annuaire de l'établissement",
  },
  annuaire_nom_associé: {
    type: String,
    default: null,
    description: "Nom dans l'annuaire de l'établissement",
  },
  present_tdb_match_siret_responsable: {
    type: Boolean,
    default: null,
    description:
      "Indique si l'établissement de l'annuaire est présent dans le Tdb en utilisant le siret_responsable comme lien",
  },
  present_tdb_match_siret_formateur: {
    type: Boolean,
    default: null,
    description:
      "Indique si l'établissement de l'annuaire est présent dans le Tdb en utilisant le siret_formateur comme lien",
  },
  present_tdb_match_uai: {
    type: Boolean,
    default: null,
    description:
      "Indique si l'établissement de l'annuaire est présent dans le Tdb en utilisant le siret_formateur comme lien",
  },
  tdb_nom_associé: {
    type: String,
    default: null,
    description: "Nom dans le Tdb de l'établissement",
  },
});
