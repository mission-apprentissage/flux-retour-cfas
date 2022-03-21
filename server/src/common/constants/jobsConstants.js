/**
 * Nom des jobs
 */
const JOB_NAMES = {
  seedUsers: "seed-users",
  seedSample: "seed-sample",
  seedReferentielCfas: "seed-referentiel-cfas",
  seedAnnuaireCfas: "seed-annuaire-cfas",
  clearSeedAssets: "clear-seed-assets",
  seedCroisementCfasAnnuaire: "seed-croisement-cfas-annuaire",
  seedRandomizedSample: "seed-randomized-sample",
  identifyUaisInCatalog: "identify-uais-types-catalog",
  mergeDecaUaisFile: "merge-deca-uais-file",
  identifyNetworkCma: "identify-network-cma",
  identifyUaisSiretsCouples: "identify-uais-sirets-couples",
  identifyUaisSiretsDuplicates: "identify-uais-sirets-duplicates",
  identifyNetworkDuplicates: "identify-network-duplicates",
  formationRetrieveFromCfd: "formation-retrieve-from-cfd",
  dossiersApprenantsRetrieveNetworks: "statutsCandidats-retrieve-networks",
  dossiersApprenantsRetrieveNiveaux: "statutsCandidats-retrieve-niveaux",
  dossiersApprenantsRetrieveSiretCatalog: "statutsCandidats-retrieve-siret-catalog",
  dossiersApprenantsRetrieveFormationsInCatalog: "statutsCandidats-retrieve-formation-in-catalog",
  dossiersApprenantsBadHistoryIdentifyAntidated: "statutsCandidats-bad-history-identify-antidated",
  dossiersApprenantsBadHistoryCleanAntidated: "statutsCandidats-bad-history-clean-antidated",
  dossiersApprenantsBadHistoryIdentifyBadDates: "statutsCandidats-bad-history-identify-badDates",
  createIndexes: "create-indexes",
  createRcoStatutsCollection: "create-rco-statuts-collection",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearDossiersApprenants: "clear-statuts-candidats",
  clearDossiersApprenantsNetworks: "clear-statuts-candidats-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  cleanCfaDataFeedback: "clean-cfaDataFeedback",
  exportDataForVoeuxAffelnet: "export-data-for-voeuxAffelnet",
  cfasRetrieveDataConnection: "cfas-retrieve-data-connection",
  repostLastStatutsReceived: "repost-last-statuts-received",
  warmUpCache: "warm-up-cache",
  retrieveRncp: "retrieve-rncp-in-tco-for-cfds",
  statutsAvecDerniersElementsHistoriqueDateIdentique: "statuts-avec-date-identique-dans-historique",
  createErpUser: "users:create-erp-user",
  generatePasswordUpdateToken: "users:generate-password-update-token",
};

/**
 * Statuts possibles pour les jobs
 */
const jobEventStatuts = {
  started: "started",
  executed: "executed",
  ended: "ended",
};

module.exports = { JOB_NAMES, jobEventStatuts };
