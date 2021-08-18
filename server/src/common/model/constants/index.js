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
  CMA: {
    nomReseau: "CMA",
    nomFichier: "cfas-cma",
    encoding: "latin1",
  },
  AGRI: {
    nomReseau: "AGRI",
    nomFichier: "cfas-agri-no-mfr",
    encoding: "utf8",
  },
  ANASUP: {
    nomReseau: "ANASUP",
    nomFichier: "cfas-anasup",
    encoding: "utf8",
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
    encoding: "utf8",
  },
  BTP_CFA: {
    nomReseau: "BTP CFA",
    nomFichier: "cfas-btp-cfa",
    encoding: "utf8",
  },
  MFR: {
    nomReseau: "MFR",
    nomFichier: "cfas-mfr",
    encoding: "utf8",
  },
};

/**
 * Liste des régions pour lesquelles on ouvre le produit
 */
const REGIONS_OUVERTES = {
  NORMANDIE: {
    nomRegion: "Normandie",
    codeRegion: "28",
  },
  CENTRE_VAL_DE_LOIRE: {
    nomRegion: "Centre-Val de Loire",
    codeRegion: "24",
  },
  AUVERGNE_RHONE_ALPES: {
    nomRegion: "Auvergne-Rhône-Alpes",
    codeRegion: "84",
  },
  BRETAGNE: {
    nomRegion: "Bretagne",
    codeRegion: "53",
  },
  PAYS_DE_LA_LOIRE: {
    nomRegion: "Pays de la Loire",
    codeRegion: "52",
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
  seedAnnuaireCfas: "seed-annuaire-cfas",
  seedCroisementCfasAnnuaire: "seed-croisement-cfas-annuaire",
  seedRandomizedSample: "seed-randomized-sample",
  identifyUaisInCatalog: "identify-uais-types-catalog",
  identifyNetworkCma: "identify-network-cma",
  identifyUaisSiretsDuplicates: "identify-uais-sirets-duplicates",
  identifyNetworkDuplicates: "identify-network-duplicates",
  identifyStatutsCandidatsDuplicates: "identify-statutsCandidats-duplicates",
  identifyCfasWithInvalidSiret: "identify-cfas-with-invalid-siret",
  identifyEmptySiretsDuplicates: "identify-empty-sirets-duplicates",
  removeStatutsCandidatsDuplicates: "remove-statutsCandidats-duplicates",
  removeEmptySiretsCandidatsDuplicates: "remove-emptySirets-duplicates",
  formationRetrieveFromCfd: "formation-retrieve-from-cfd",
  formationRetrieveNiveaux: "formation-retrieve-niveaux",
  statutsCandidatsRetrieveLocation: "statutsCandidats-retrieve-location",
  statutsCandidatsRetrieveNetworks: "statutsCandidats-retrieve-networks",
  statutsCandidatsRetrieveCfdHistory: "statutsCandidats-retrieve-cfd-history",
  statutsCandidatsRetrieveNiveaux: "statutsCandidats-retrieve-niveaux",
  statutsCandidatsRetrieveSiretCatalog: "statutsCandidats-retrieve-siret-catalog",
  statutsCandidatsSanitizeEmptyStrings: "statutsCandidats-sanitize-empty-strings",
  statutsCandidatsRetrieveFormationsInCatalog: "statutsCandidats-retrieve-formation-in-catalog",
  createIndexes: "create-indexes",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearStatutsCandidats: "clear-statuts-candidats",
  clearStatutsCandidatsNetworks: "clear-statuts-candidats-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  cleanStatutsCandidats: "clean-statuts-candidats",
  cleanCfaDataFeedback: "clean-cfaDataFeedback",
  checkSiretValidity: "check-siret-validity",
  checkUaiValidity: "check-uai-validity",
  fixHistoriqueStatutApprenant: "fix-historique-statut-apprenant-date-statut",
  cfasRetrieveDataConnection: "cfas-retrieve-data-connection",
  cfasCroisementDeca: "cfas-croisement-cfas-deca",
  calculateStats: "calculate-stats",
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
};

/**
 * Types de stats possibles
 */
const statsTypes = {
  uaiStats: "UaiStats",
  tdbStats: "TdbStats",
  networksStats: "NetworksStats",
  importDatesStats: "ImportDatesStats",
  siretsNotFoundTco: "SiretsNotFoundInTCO",
};

/**
 * Type de source des données
 */
const dataSource = {
  all: "all",
  ymag: "ymag",
  gesti: "gesti",
};

const statutsCandidatsStringFields = [
  "ine_apprenant",
  "prenom2_apprenant",
  "prenom3_apprenant",
  "email_contact",
  "libelle_court_formation",
  "libelle_long_formation",
  "siret_etablissement",
  "date_metier_mise_a_jour_statut",
  "periode_formation",
];

module.exports = {
  codesStatutsCandidats,
  codesMajStatutsInterdits,
  codesStatutsMajStatutCandidats,
  reseauxCfas,
  REGIONS_OUVERTES,
  jobNames,
  erps,
  duplicatesTypesCodes,
  statsTypes,
  dataSource,
  statutsCandidatsStringFields,
};
