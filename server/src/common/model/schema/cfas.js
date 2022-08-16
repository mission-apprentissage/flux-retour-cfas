const { Schema } = require("mongoose");

module.exports = new Schema({
  uai: {
    type: String,
    default: null,
    description: "Code uai de l'établissement",
  },
  uai_valid: {
    type: Boolean,
    description: "Le champ uai est-il valide ?",
  },
  sirets: {
    type: [String],
    default: [],
    description: "Liste des sirets reliés à l'établissement",
  },
  nature: {
    type: String,
    description: "Nature de l'organisme de formation",
  },
  nature_validity_warning: {
    type: Boolean,
    description: "Y a-t-il un doute sur la validié de la nature",
  },
  siret_formateur: {
    type: Boolean,
    default: null,
    description: "Indique si le siret de l'établissement a été identifié comme un siret formateur",
  },
  siret_responsable: {
    type: Boolean,
    default: null,
    description: "Indique si le siret de l'établissement a été identifié comme un siret responsable",
  },
  nom: {
    type: String,
    default: null,
    description: "Nom de l'organisme de formation",
  },
  nom_tokenized: {
    type: String,
    description: "Nom de l'organisme de formation tokenized pour la recherche textuelle",
  },
  adresse: {
    type: String,
    default: null,
    description: "Adresse de l'établissement",
  },
  erps: {
    type: [String],
    default: [],
    description: "ERPs rattachés au CFA, s'ils existent",
  },
  reseaux: {
    type: [String],
    default: [],
    description: "Réseaux du CFA, s'ils existent",
  },
  region_nom: {
    type: String,
    default: null,
    description: "Région du CFA",
  },
  region_num: {
    type: String,
    default: null,
    description: "Numéro de la région du CFA",
  },
  first_transmission_date: {
    type: Date,
    default: null,
    description: "Date de la première transmission de données",
  },
  metiers: {
    type: [String],
    default: [],
    description: "Les domaines métiers rattachés à l'établissement",
  },
  access_token: {
    type: String,
    default: null,
    description: "Le token permettant l'accès au CFA à sa propre page",
  },
  private_url: {
    type: String,
    default: null,
    description: "L'url via laquelle le CFA peut accéder à sa propre page",
  },
  updated_at: {
    type: Date,
    default: null,
    description: "Date de mise à jour en base de données",
  },
  created_at: {
    type: Date,
    description: "Date d'ajout en base de données",
  },
});
