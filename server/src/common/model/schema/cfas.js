const { Schema } = require("mongoose");

const cfasSchema = new Schema({
  uai: {
    type: String,
    default: null,
    description: "Code uai de l'établissement",
  },
  siret: {
    type: String,
    default: null,
    description: "Siret de l'établissement",
  },
  siren: {
    type: String,
    default: null,
    description: "N° de Siren",
  },
  nom: {
    type: String,
    default: null,
    description: "Nom de l'établissement",
  },
  noms_cfa: {
    type: [String],
    default: null,
    description: "Liste des noms de l'établissement identifiés",
  },
  emails_contact: {
    type: [String],
    default: null,
    description: "Emails de contact cfa",
  },
  telephone: {
    type: String,
    default: null,
    description: "Téléphone du cfa",
  },
  branchement_flux_cfa_erp: {
    type: Boolean,
    default: false,
    description: "Indique si le flux vers ce CFA a été mis en place et les données récupérées depuis son ERP",
  },
  erps: {
    type: [String],
    default: null,
    description: "ERPs rattachés au CFA, s'ils existent",
  },
  reseaux: {
    type: [String],
    default: undefined, // here we use undefined instead of null because mongoose would otherwise default the field to [], see https://mongoosejs.com/docs/schematypes.html#arrays
    description: "Réseaux du CFA, s'ils existent",
  },
  reponse_enquete_ds: {
    type: Boolean,
    default: false,
    description: "Indique si ce CFA a répondu à l'enquête Démarches Simplifiées",
  },
  consentement_cfa_erp: {
    type: Boolean,
    default: null,
    description: "Indique si ce CFA ne souhaite pas le branchement depuis son ERP",
  },
  fichiers_reference: {
    type: [String],
    default: [],
    description: "Fichiers dans lesquels le cfa est identifié",
  },
});

module.exports = cfasSchema;
