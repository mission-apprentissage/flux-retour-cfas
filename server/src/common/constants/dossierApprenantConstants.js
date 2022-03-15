/**
 * Codes des statuts des apprenants
 */
const CODES_STATUT_APPRENANT = {
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
};

/**
 * Nom des statuts
 */
const LABELS_STATUT_APPRENANT = [
  { code: CODES_STATUT_APPRENANT.abandon, name: "abandon" },
  { code: CODES_STATUT_APPRENANT.inscrit, name: "inscrit" },
  { code: CODES_STATUT_APPRENANT.apprenti, name: "apprenti" },
];

/**
 * Fonction de récupération d'un nom de statut depuis son code
 * @param {*} statutCode
 * @returns
 */
const getStatutApprenantNameFromCode = (statutCode) =>
  LABELS_STATUT_APPRENANT.find((item) => item.code === statutCode)?.name ?? "NC";

/**
 * Code pour les types de doublons identifiables
 */
const duplicatesTypesCodes = {
  unique: {
    name: "Uniques (clé d'unicité identique)",
    code: 1,
  },
  formation_cfd: {
    name: "CFDs",
    code: 2,
  },
  prenom_apprenant: {
    name: "Prenom",
    code: 3,
  },
  nom_apprenant: {
    name: "Nom",
    code: 4,
  },
  uai_etablissement: {
    name: "Uai",
    code: 5,
  },
};

/**
 * Liste des champs strings
 */
const statutsCandidatsStringFields = [
  "ine_apprenant",
  "email_contact",
  "libelle_court_formation",
  "libelle_long_formation",
  "siret_etablissement",
  "date_metier_mise_a_jour_statut",
  "periode_formation",
];

/**
 * Liste des indicateurs
 */
const effectifsIndicators = {
  apprentis: "apprentis",
  inscritsSansContrats: "inscritsSansContrats",
  rupturants: "rupturants",
  abandons: "abandons",
};

module.exports = {
  CODES_STATUT_APPRENANT,
  duplicatesTypesCodes,
  statutsCandidatsStringFields,
  effectifsIndicators,
  LABELS_STATUT_APPRENANT,
  getStatutApprenantNameFromCode,
};
