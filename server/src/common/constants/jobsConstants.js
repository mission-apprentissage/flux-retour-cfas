/**
 * Nom des jobs
 */
export const JOB_NAMES = {
  seedSample: "seed-sample",
  seedCfas: "seed-cfas",
  seedReseauxCfas: "seed-reseauxCfas",
  clearSeedAssets: "clear-seed-assets",
  seedRandomizedSample: "seed-randomized-sample",
  identifyUaisInCatalog: "identify-uais-types-catalog",
  identifyNetworkDuplicates: "identify-network-duplicates",
  dossiersApprenantsRetrieveNetworks: "dossiersApprenants-retrieve-networks",
  dossiersApprenantsRetrieveNiveaux: "dossiersApprenants-retrieve-niveaux",
  dossiersApprenantsRetrieveFormateurGestionnairesCatalog: "dossiersApprenants-retrieve-formateur-gestionnaire-catalog",
  dossiersApprenantsBadHistoryIdentifyAntidated: "dossiersApprenants-bad-history-identify-antidated",
  createIndexes: "create-indexes",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearDossiersApprenants: "clear-dossiersApprenants",
  clearDossiersApprenantsNetworks: "clear-dossiersApprenants-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  repostLatestDossiersApprenantsReceived: "repost-latest-dossiersApprenants-received",
  warmUpCache: "warm-up-cache",
  retrieveRncps: "retrieve-rncps-in-tco-for-cfds",
  createErpUser: "users:create-erp-user",
  createUser: "users:create-user",
  generatePasswordUpdateToken: "users:generate-password-update-token",
};

/**
 * Statuts possibles pour les jobs
 */
export const jobEventStatuts = {
  started: "started",
  executed: "executed",
  ended: "ended",
};
