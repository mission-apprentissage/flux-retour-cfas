const { Schema } = require("mongoose");

module.exports = new Schema({
  dossierApprenant_id: {
    type: Schema.ObjectId,
    required: true,
    description: "Identifiant du dossierApprenant lié",
  },
  ine_apprenant: {
    type: String,
    default: null,
    description: "N° INE de l'apprenant",
  },
  uai_etablissement: {
    type: String,
    default: null,
    description: "Code uai de l'établissement formateur",
    index: true,
    sparse: true,
  },
  etablissement_formateur_uai: {
    type: String,
    default: null,
    description: "UAI du CFA formateur",
  },
  statut_apprenant: {
    type: String,
    default: null,
    description: "Statut du jeune",
  },
  formation_rncp: {
    type: String,
    default: null,
    description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
  },
  nom_apprenant: {
    type: String,
    default: null,
    description: "Nom de l'apprenant",
  },
  prenom_apprenant: {
    type: String,
    default: null,
    description: "Prénom de l'apprenant",
  },
  code_commune_insee_apprenant: {
    type: String,
    default: null,
    description: "Code commune insee de l'apprenant",
  },
  tel_apprenant: {
    type: String,
    default: null,
    description: "Numéro de téléphone de l'apprenant",
  },
  email_contact: {
    type: String,
    default: null,
    description: "Adresse mail de contact de l'apprenant",
  },
  date_de_naissance_apprenant: {
    type: Date,
    default: null,
    description: "Date de naissance de l'apprenant",
  },
  date_entree_formation: {
    type: Date,
    default: null,
    description: "Date d'entree en formation",
  },
  contrat_date_debut: {
    type: Date,
    default: null,
    description: "Date de début du contrat",
  },
  contrat_date_rupture: {
    type: Date,
    default: null,
    description: "Date de rupture du contrat",
  },
  is_valid: {
    type: Boolean,
    default: false,
    description: "Indique si la donnée est considérée comme valide",
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
