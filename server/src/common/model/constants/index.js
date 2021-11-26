/**
 * Codes des statuts des candidats
 */
const codesStatutsCandidats = {
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
 * Noms des réseaux de CFAS
 */
const reseauxCfas = {
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
  CCI: {
    nomReseau: "CCI",
    nomFichier: "cfas-cci",
    encoding: "utf8",
  },
  CFA_EC: {
    nomReseau: "CFA EC",
    nomFichier: "cfas-cfa-ec",
    encoding: "utf8",
  },
  GRETA: {
    nomReseau: "GRETA",
    nomFichier: "cfas-greta",
    encoding: "utf8",
  },
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
 * Liste des régions déployées
 */
const REGIONS_DEPLOYEES = [
  {
    nom: "Normandie",
    code: "28",
  },
  {
    nom: "Centre-Val de Loire",
    code: "24",
  },
  {
    nom: "Auvergne-Rhône-Alpes",
    code: "84",
  },
  {
    nom: "Bretagne",
    code: "53",
  },
  {
    nom: "Pays de la Loire",
    code: "52",
  },
  {
    nom: "Hauts-de-France",
    code: "32",
  },
  {
    nom: "Île-de-France",
    code: "11",
  },
  {
    nom: "Occitanie",
    code: "76",
  },
  {
    nom: "Grand Est",
    code: "44",
  },
  {
    nom: "Nouvelle-Aquitaine",
    code: "75",
  },
];

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
  seedCfasAccessTokens: "seed-cfas-without-network-urls",
  seedAnnuaireCfas: "seed-annuaire-cfas",
  seedCroisementCfasAnnuaire: "seed-croisement-cfas-annuaire",
  seedRandomizedSample: "seed-randomized-sample",
  identifyUaisInCatalog: "identify-uais-types-catalog",
  mergeDecaUaisFile: "merge-deca-uais-file",
  rawUserEventsAnalysis: "raw-userEvents-analysis",
  identifyNetworkCma: "identify-network-cma",
  identifyUaisSiretsCouples: "identify-uais-sirets-couples",
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
  createRcoStatutsCollection: "create-rco-statuts-collection",
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
  exportDataForVoeuxAffelnet: "export-data-for-voeuxAffelnet",
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
  "email_contact",
  "libelle_court_formation",
  "libelle_long_formation",
  "siret_etablissement",
  "date_metier_mise_a_jour_statut",
  "periode_formation",
];

const jobEventActions = {
  started: "started",
  executed: "executed",
  ended: "ended",
};

module.exports = {
  codesStatutsCandidats,
  codesStatutsMajStatutCandidats,
  reseauxCfas,
  REGIONS_DEPLOYEES,
  jobNames,
  erps,
  duplicatesTypesCodes,
  statsTypes,
  dataSource,
  statutsCandidatsStringFields,
  jobEventStatuts: jobEventActions,
};
