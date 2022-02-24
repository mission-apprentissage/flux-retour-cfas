const { Schema } = require("mongoose");

module.exports = new Schema({
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
  formation_cfd: {
    type: String,
    default: null,
    description: "CFD de la formation du candidat",
    index: true,
  },
  formation_cfd_is_outdated: {
    type: Boolean,
    default: false,
    description: "Indique si le CFD de la formation est outdated",
  },
  formation_cfd_new: {
    type: String,
    default: null,
    description: "Nouveau CFD de la formation du candidat si cfd d'origine outdated",
  },
  formation_cfd_start_date: {
    type: Date,
    default: null,
    description: "Date d'ouverture du CFD",
  },
  formation_cfd_end_date: {
    type: Date,
    default: null,
    description: "Date de fermeture du CFD",
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
    description: "Code uai de l'établissement d'origine",
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
  nom_etablissement_tokenized: {
    type: String,
    default: null,
    description: "Nom de l'établissement d'origine tokenized pour la recherche textuelle",
  },
  etablissement_reseaux: {
    type: [String],
    default: [],
    description: "Réseaux du CFA, s'ils existent",
  },
  etablissement_adresse: {
    type: String,
    default: null,
    description: "Adresse complète de l'établissement",
  },
  etablissement_code_postal: {
    type: String,
    default: null,
    description: "Code postal établissement",
  },
  etablissement_localite: {
    type: String,
    default: null,
    description: "Localité établissement",
  },
  etablissement_geo_coordonnees: {
    type: String,
    implicit_type: "geo_point",
    default: null,
    description: "Latitude et longitude de l'établissement",
  },
  etablissement_nom_region: {
    type: String,
    default: null,
    description: "Région de l'établissement",
  },
  etablissement_num_region: {
    type: String,
    default: null,
    description: "Numéro de la région de l'établissement",
  },
  etablissement_num_departement: {
    type: String,
    default: null,
    description: "Numéro de departement de l'établissement",
  },
  etablissement_nom_departement: {
    type: String,
    default: null,
    description: "Nom du departement de l'établissement",
  },
  etablissement_nom_academie: {
    type: String,
    default: null,
    description: "Nom de l'académie de l'établissement",
  },
  etablissement_num_academie: {
    type: String,
    default: null,
    description: "Numéro de l'académie de l'établissement",
  },
  etablissement_gestionnaire_siret: {
    type: String,
    default: null,
    description: "Siret de l'établissement gestionnaire - depuis le catalogue",
  },
  etablissement_formateur_siret: {
    type: String,
    default: null,
    description: "Siret de l'établissement formateur - depuis le catalogue",
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
  date_metier_mise_a_jour_statut: {
    type: Date,
    default: null,
    description: "Date métier de mise à jour du statut",
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
    description: 'Année scolaire sur laquelle le statut candidat est enregistré (ex: "2020-2021")',
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
  match_formation_mnaCatalog_cfd_siret: {
    type: Boolean,
    default: false,
    description: "Flag d'identification de la formation dans le Catalogue MNA sur la base du CFD + SIRET",
  },
  id_erp_apprenant: {
    type: String,
    default: null,
    description: "Identifiant du jeune dans l'erp",
  },
  tel_apprenant: {
    type: String,
    default: null,
    description: "Numéro de téléphone du jeune",
  },
  code_commune_insee_apprenant: {
    type: String,
    default: null,
    description: "Code commune insee du jeune",
  },
  date_de_naissance_apprenant: {
    type: Date,
    default: null,
    description: "Date de naissance du jeune",
  },
  etablissement_formateur_geo_coordonnees: {
    type: String,
    implicit_type: "geo_point",
    default: null,
    description: "Latitude et longitude de l'établissement formateur",
  },
  etablissement_formateur_code_commune_insee: {
    type: String,
    default: null,
    description: "Code commune de l'établissement formateur",
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
    description: "Code RNCP de la formation du candidat",
  },
});
