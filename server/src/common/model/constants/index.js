/**
 * Codes des statuts des candidats
 */
const codesStatutsCandidats = {
  prospect: 1,
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
};

/**
 * Code pour le statut de la mise à jour du statut candidat
 * Ex: passage du statut
 */
const codesStatutsMajStatutCandidats = {
  ok: 0,
  ko: 1,
};

/**
 * Liste des changements de statuts interdits
 * Ex: passage du statut inscrit au statut prospect n'est pas cohérent
 */
const codesMajStatutsInterdits = [
  {
    source: codesStatutsCandidats.inscrit,
    destination: codesStatutsCandidats.prospect,
  },
  {
    source: codesStatutsCandidats.apprenti,
    destination: codesStatutsCandidats.prospect,
  },
  {
    source: codesStatutsCandidats.apprenti,
    destination: codesStatutsCandidats.inscrit,
  },
];

/**
 * Noms des réseaux de CFAS
 */
const reseauxCfas = {
  CCCA_BTP: {
    nomReseau: "CCCA Btp",
    nomFichier: "cfas-ccca-btp",
  },
  CCCI_France: {
    nomReseau: "CCCI France",
    nomFichier: "cfas-cci-france",
  },
  CMA: {
    nomReseau: "CMA",
    nomFichier: "cfas-cma",
  },
  AGRI: {
    nomReseau: "AGRI",
    nomFichier: "cfas-agri",
  },
  ANASUP: {
    nomReseau: "ANASUP",
    nomFichier: "cfas-anasup",
  },
  PROMOTRANS: {
    nomReseau: "PROMOTRANS",
    nomFichier: "cfas-promotrans",
  },
};

module.exports = {
  codesStatutsCandidats,
  codesMajStatutsInterdits,
  codesStatutsMajStatutCandidats,
  reseauxCfas,
};
