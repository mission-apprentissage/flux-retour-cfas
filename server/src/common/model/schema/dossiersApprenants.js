const { Schema } = require("mongoose");

module.exports = new Schema({
  ine_apprenant: {
    type: String,
    default: null,
    description: "N° INE de l'apprenant",
    index: true,
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
  email_contact: {
    type: String,
    default: null,
    description: "Adresse mail de contact de l'apprenant",
  },
  formation_cfd: {
    type: String,
    default: null,
    description: "CFD de la formation à laquelle l'apprenant est inscrit",
    index: true,
  },
  libelle_long_formation: {
    type: String,
    default: null,
    description: "Libellé court de la formation visée",
  },
  niveau_formation: {
    type: String,
    default: null,
    description: "Le niveau de la formation (ex: 3)",
  },
  niveau_formation_libelle: {
    type: String,
    default: null,
    description: "Libellé du niveau de la formation (ex: '3 (BTS, DUT...)')",
  },
  uai_etablissement: {
    type: String,
    default: null,
    description: "Code uai de l'établissement formateur",
    index: true,
    sparse: true,
  },
  siret_etablissement: {
    type: String,
    default: null,
    description: "Siret de l'établissement d'origine",
  },
  siret_etablissement_valid: {
    type: Boolean,
    description: "Le champ siret_etablissement est-il valide ?",
  },
  siret_catalogue: {
    type: String,
    default: null,
    description: "Siret de l'établissement retrouvé depuis le catalogue",
  },
  nom_etablissement: {
    type: String,
    default: null,
    description: "Nom de l'établissement d'origine",
  },
  etablissement_reseaux: {
    type: [String],
    default: [],
    description: "Réseaux du CFA, s'ils existent",
  },
  etablissement_adresse: {
    type: String,
    default: null,
    description: "Adresse complète du CFA",
  },
  etablissement_code_postal: {
    type: String,
    default: null,
    description: "Code postal du CFA",
  },
  etablissement_localite: {
    type: String,
    default: null,
    description: "Localité du CFA",
  },
  etablissement_geo_coordonnees: {
    type: String,
    implicit_type: "geo_point",
    default: null,
    description: "Latitude et longitude du CFA",
  },
  etablissement_nom_region: {
    type: String,
    default: null,
    description: "Région du CFA",
  },
  etablissement_num_region: {
    type: String,
    default: null,
    description: "Numéro de la région du CFA",
  },
  etablissement_num_departement: {
    type: String,
    default: null,
    description: "Numéro de departement du CFA",
  },
  etablissement_nom_departement: {
    type: String,
    default: null,
    description: "Nom du departement du CFA",
  },
  etablissement_nom_academie: {
    type: String,
    default: null,
    description: "Nom de l'académie du CFA",
  },
  etablissement_num_academie: {
    type: String,
    default: null,
    description: "Numéro de l'académie du CFA",
  },
  etablissement_gestionnaire_uai: {
    type: String,
    default: null,
    description: "UAI du CFA gestionnaire - depuis le catalogue",
  },
  etablissement_formateur_uai: {
    type: String,
    default: null,
    description: "UAI du CFA formateur - depuis le catalogue",
  },
  etablissement_gestionnaire_siret: {
    type: String,
    default: null,
    description: "Siret du CFA gestionnaire - depuis le catalogue",
  },
  etablissement_formateur_siret: {
    type: String,
    default: null,
    description: "Siret du CFA formateur - depuis le catalogue",
  },
  historique_statut_apprenant: {
    type: [Object],
    default: [],
    description: "Historique du statut de l'apprenant",
  },
  periode_formation: {
    type: [Number],
    default: [],
    description: "Date debut & date de fin de la formation",
  },
  annee_formation: {
    type: Number,
    default: null,
    description: "Numéro de l'année dans la formation (promo)",
  },
  annee_scolaire: {
    type: String,
    description: `Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")`,
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
  source: {
    type: String,
    description: "Source du dossier apprenant (Ymag, Gesti...)",
    index: true,
  },
  match_formation_mnaCatalog_cfd_siret: {
    type: Boolean,
    default: false,
    description: "Flag d'identification de la formation dans le Catalogue MNA sur la base du CFD + SIRET",
  },
  id_erp_apprenant: {
    type: String,
    default: null,
    description: "Identifiant de l'apprenant dans l'erp",
  },
  tel_apprenant: {
    type: String,
    default: null,
    description: "Numéro de téléphone de l'apprenant",
  },
  code_commune_insee_apprenant: {
    type: String,
    default: null,
    description: "Code commune insee de l'apprenant",
  },
  date_de_naissance_apprenant: {
    type: Date,
    default: null,
    description: "Date de naissance de l'apprenant",
  },
  etablissement_formateur_ville: {
    type: String,
    default: null,
    description: "Ville de l'établissement formateur",
  },
  contrat_date_debut: {
    type: Date,
    default: null,
    description: "Date de début du contrat",
  },
  contrat_date_fin: {
    type: Date,
    default: null,
    description: "Date de fin du contrat",
  },
  contrat_date_rupture: {
    type: Date,
    default: null,
    description: "Date de rupture du contrat",
  },
  date_entree_formation: {
    type: Date,
    default: null,
    description: "Date d'entrée dans la formation",
  },
  formation_rncp: {
    type: String,
    default: null,
    description: "Code RNCP de la formation à laquelle l'apprenant est inscrit",
  },
});
