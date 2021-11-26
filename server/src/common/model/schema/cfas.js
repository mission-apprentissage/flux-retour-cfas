const { Schema } = require("mongoose");

const cfasSchema = new Schema({
  uai: {
    type: String,
    default: null,
    description: "Code uai de l'établissement",
  },
  sirets: {
    type: [String],
    default: [],
    description: "Liste des sirets reliés à l'établissement",
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
    description: "Nom de l'établissement",
  },
  adresse: {
    type: String,
    default: null,
    description: "Adresse de l'établissement",
  },
  branchement_tdb: {
    type: Boolean,
    default: false,
    description: "Indique si le flux vers ce CFA a été mis en place et les données récupérées depuis son ERP",
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
  source_seed_cfa: {
    type: String,
    default: null,
    description: "Source du seed du cfa dans la collection (StatutsCandidats ou fichier d'origine)",
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
});

module.exports = cfasSchema;
