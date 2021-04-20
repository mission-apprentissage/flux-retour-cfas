/**
 * Codes des statuts des candidats
 */
const codesStatutsCandidats = {
  prospect: 1,
  inscrit: 2,
  apprenti: 3,
  abandon: 0,
  abandonProspects: 4,
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
  // CCCA_BTP: {
  //   nomReseau: "CCCA Btp",
  //   nomFichier: "cfas-ccca-btp",
  // },
  // CCCI_France: {
  //   nomReseau: "CCI France",
  //   nomFichier: "cfas-cci-france",
  // },
  // CMA: {
  //   nomReseau: "CMA",
  //   nomFichier: "cfas-cma",
  // },
  // AGRI: {
  //   nomReseau: "AGRI",
  //   nomFichier: "cfas-agri",
  // },
  ANASUP: {
    nomReseau: "ANASUP",
    nomFichier: "cfas-anasup",
  },
  // PROMOTRANS: {
  //   nomReseau: "PROMOTRANS",
  //   nomFichier: "cfas-promotrans",
  // },
  // COMPAGNONS_DU_DEVOIR: {
  //   nomReseau: "COMPAGNONS DU DEVOIR",
  //   nomFichier: "cfas-compagnons-du-devoir",
  // },
  UIMM: {
    nomReseau: "UIMM",
    nomFichier: "cfas-uimm",
  },
  BTP_CFA: {
    nomReseau: "BTP CFA",
    nomFichier: "cfas-btp-cfa",
  },
  MFR: {
    nomReseau: "MFR",
    nomFichier: "cfas-mfr",
  },
};

/**
 * Noms des régions de CFAS
 */
const regionsCfas = {
  NORMANDIE: {
    nomRegion: "Normandie",
    numRegion: "28",
    nomFichier: "cfas-normandie",
  },
  CENTRE_VAL_DE_LOIRE: {
    nomRegion: "Centre-Val de loire",
    numRegion: "24",
    nomFichier: "cfas-centre-val-de-loire",
  },
};

/**
 * Noms des ERPs
 */
const erps = {
  YMAG: {
    nomErp: "Ymag",
    nomFichier: "referentielCfas_ymag",
  },
  GESTI: {
    nomErp: "Gesti",
    nomFichier: "referentielCfas_gesti",
  },
  SCFORM: {
    nomErp: "SCForm",
    nomFichier: "referentielCfas_scform",
  },
};

/**
 * Nom des jobs
 */
const jobNames = {
  test: "test-job",
  sanitizeSirets: "sanitize-sirets",
  retrieveSiretsFromYmagUais: "retrieve-sirets-from-ymag-uais",
  retrieveSiretsFromGestiUais: "retrieve-sirets-from-gesti-uais",
  seedUsers: "seed-users",
  seedSample: "seed-sample",
  seedReferentielCfas: "seed-referentiel-cfas",
  seedRandomizedSample: "seed-randomized-sample",
  identifyNetworkCma: "identify-network-cma",
  identifyNetworkDuplicates: "identify-network-duplicates",
  identifyStatutsCandidatsDuplicates: "identify-statutsCandidats-duplicates",
  identifyCfasWithInvalidSiret: "identify-cfas-with-invalid-siret",
  removeStatutsCandidatsDuplicates: "remove-statutsCandidats-duplicates",
  formationRetrieveFromCfd: "formation-retrieve-from-cfd",
  formationRetrieveNiveaux: "formation-retrieve-niveaux",
  statutsCandidatsRetrieveLocation: "statutsCandidats-retrieve-location",
  statutsCandidatsRetrieveNetworks: "statutsCandidats-retrieve-networks",
  statutsCandidatsRetrieveNiveaux: "statutsCandidats-retrieve-niveaux",
  createIndexes: "create-indexes",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearStatutsCandidats: "clear-statuts-candidats",
  clearStatutsCandidatsNetworks: "clear-statuts-candidats-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  checkSiretValidity: "check-siret-validity",
  checkUaiValidity: "check-uai-validity",
  fixHistoriqueStatutApprenant: "fix-historique-statut-apprenant-date-statut",
  cfasRetrieveDataConnection: "cfas-retrieve-data-connection",
};

/**
 * Code pour les types de doublons identifiables
 */
const duplicatesTypesCodes = {
  all: {
    name: "Tous",
    code: 0,
  },
  periode_formation: {
    name: "Periodes",
    code: 1,
  },
  id_formation: {
    name: "CFDs",
    code: 2,
  },
  ine: {
    name: "INEs",
    code: 3,
  },
  email_contact: {
    name: "Emails",
    code: 4,
  },
  prenoms: {
    name: "Prenoms",
    code: 5,
  },
};

module.exports = {
  codesStatutsCandidats,
  codesMajStatutsInterdits,
  codesStatutsMajStatutCandidats,
  reseauxCfas,
  regionsCfas,
  jobNames,
  erps,
  duplicatesTypesCodes,
};
