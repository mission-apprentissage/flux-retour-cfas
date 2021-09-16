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
  formation_cfd_valid: {
    type: Boolean,
    description: "Le champ formation_cfd est-il un cfd valide ?",
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
    description: "Le niveau de la formation",
  },
  uai_etablissement: {
    type: String,
    default: null,
    description: "Code uai de l'établissement d'origine",
    index: true,
    sparse: true,
  },
  uai_etablissement_valid: {
    type: Boolean,
    description: "Le champ uai_etablissement est-il valide ?",
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
  etablissement_formateur_code_postal: {
    type: String,
    default: null,
    description: "Code postal de l'établissement formateur",
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
});

module.exports = statutsCandidatsSchema;
