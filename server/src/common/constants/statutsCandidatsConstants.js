/**
 * Codes des statuts des candidats
 */
const codesStatutsCandidats = {
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
};

/**
 * Nom des statuts
 */
const statutsCandidatsNames = [
  { code: codesStatutsCandidats.abandon, name: "abandon" },
  { code: codesStatutsCandidats.inscrit, name: "inscrit" },
  { code: codesStatutsCandidats.apprenti, name: "apprenti" },
];

/**
 * Fonction de récupération d'un nom de statut depuis son code
 * @param {*} statutCode
 * @returns
 */
const getStatutNameFromCode = (statutCode) =>
  statutsCandidatsNames.find((item) => item.code === statutCode)?.name ?? "NC";

/**
 * Code pour le statut de la mise à jour du statut candidat
 * Ex: passage du statut
 */
const codesStatutsMajStatutCandidats = {
  ok: 0,
  ko: 1,
};

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
  codesStatutsCandidats,
  codesStatutsMajStatutCandidats,
  duplicatesTypesCodes,
  statutsCandidatsStringFields,
  effectifsIndicators,
  statutsCandidatsNames,
  getStatutNameFromCode,
};
