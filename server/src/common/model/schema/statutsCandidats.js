const { Schema } = require("mongoose");

const statutsCandidatsSchema = new Schema({
  ine_apprenant: {
    type: String,
    default: null,
    description: "N° INE du jeune",
    index: true,
  },
  nom_apprenant: {
    type: String,
    default: null,
    description: "Nom du jeune",
  },
  prenom_apprenant: {
    type: String,
    default: null,
    description: "Prénom du jeune",
  },
  prenom2_apprenant: {
    type: String,
    default: null,
    description: "Prénom 2 du jeune",
  },
  prenom3_apprenant: {
    type: String,
    default: null,
    description: "Prénom 3 du jeune",
  },
  ne_pas_solliciter: {
    type: Boolean,
    default: false,
    description: "Ne pas solliciter le jeune ou ses parents",
  },
  email_contact: {
    type: String,
    default: null,
    description: "Adresse mail de contact du jeune",
  },
  nom_representant_legal: {
    type: String,
    default: null,
    description: "Nom du représentant légal",
  },
  tel_representant_legal: {
    type: String,
    default: null,
    description: "Numéro de tel du représentant légal du jeune",
  },
  tel2_representant_legal: {
    type: String,
    default: null,
    description: "Numéro de tel du représentant légal du jeune",
  },
  id_formation: {
    type: String,
    default: null,
    description: "Identifiant de la formation visée",
    index: true,
  },
  libelle_court_formation: {
    type: String,
    default: null,
    description: "Libellé court de la formation visée",
  },
  libelle_long_formation: {
    type: String,
    default: null,
    description: "Libellé court de la formation visée",
  },
  uai_etablissement: {
    type: String,
    default: null,
    description: "Code uai de l'établissement d'origine",
    index: true,
    sparse: true,
  },
  nom_etablissement: {
    type: String,
    default: null,
    description: "Nom de l'établissement d'origine",
  },
  statut_apprenant: {
    type: Number,
    default: null,
    description: "Statut de l'apprenant",
    index: true,
  },
  historique_statut_apprenant: {
    type: [Object],
    default: [],
    description: "Historique du statut de l'apprenant",
  },
  date_mise_a_jour_statut: {
    type: Date,
    default: Date.now,
    description: "Date de mise à jour du statut",
  },
  date_metier_mise_a_jour_statut: {
    type: Date,
    default: null,
    description: "Date métier de mise à jour du statut",
  },
  statut_mise_a_jour_statut: {
    type: Number,
    default: 0,
    description: "Statut de mise à jour du statut candidat 0 = OK / 1 = KO",
  },
  erreur_mise_a_jour_statut: {
    type: Object,
    default: null,
    description: "Erreur de mise à jour de statuts",
  },
  updated_at: {
    type: Date,
    default: null,
    description: "Date d'ajout en base de données",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
  source: {
    type: String,
    description: "Source du statut candidat (Ymag, Gesti...)",
    index: true,
  },
});

module.exports = statutsCandidatsSchema;
