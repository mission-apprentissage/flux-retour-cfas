/**
 * Codes des statuts des apprenants
 */
export const CODES_STATUT_APPRENANT = {
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
};

/**
 * Nom des statuts
 */
export const LABELS_STATUT_APPRENANT = [
  { code: CODES_STATUT_APPRENANT.abandon, name: "abandon" },
  { code: CODES_STATUT_APPRENANT.inscrit, name: "inscrit" },
  { code: CODES_STATUT_APPRENANT.apprenti, name: "apprenti" },
];

/**
 * Fonction de récupération d'un nom de statut depuis son code
 * @param {*} statutCode
 * @returns
 */
export const getStatutApprenantNameFromCode = (statutCode) =>
  LABELS_STATUT_APPRENANT.find((item) => item.code === statutCode)?.name ?? "NC";

/**
 * Liste des nom des indicateurs
 */
export const EFFECTIF_INDICATOR_NAMES = {
  apprentis: "apprenti",
  inscritsSansContrats: "inscrit sans contrat",
  rupturants: "rupturant",
  abandons: "abandon",
};
