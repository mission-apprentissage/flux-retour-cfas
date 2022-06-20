/**
 * Nom des jobs
 */
const JOB_NAMES = {
  seedSample: "seed-sample",
  seedCfas: "seed-cfas",
  seedReseauxCfas: "seed-reseauxCfas",
  seedReferentielCfas: "seed-referentiel-cfas",
  clearSeedAssets: "clear-seed-assets",
  seedRandomizedSample: "seed-randomized-sample",
  identifyUaisInCatalog: "identify-uais-types-catalog",
  identifyUaisSiretsCouples: "identify-uais-sirets-couples",
  identifyUaisSiretsDuplicates: "identify-uais-sirets-duplicates",
  identifyNetworkDuplicates: "identify-network-duplicates",
  formationRetrieveFromCfd: "formation-retrieve-from-cfd",
  dossiersApprenantsRecomputeSiretValidity: "dossiersApprenants-recompute-siret-validity",
  dossiersApprenantsRetrieveNetworks: "dossiersApprenants-retrieve-networks",
  dossiersApprenantsRetrieveNiveaux: "dossiersApprenants-retrieve-niveaux",
  dossiersApprenantsRetrieveSiretCatalog: "dossiersApprenants-retrieve-siret-catalog",
  dossiersApprenantsRetrieveFormateurGestionnairesCatalog: "dossiersApprenants-retrieve-formateur-gestionnaire-catalog",
  dossiersApprenantsRetrieveFormationsInCatalog: "dossiersApprenants-retrieve-formation-in-catalog",
  dossiersApprenantsBadHistoryIdentifyAntidated: "dossiersApprenants-bad-history-identify-antidated",
  dossiersApprenantsBadHistoryCleanAntidated: "dossiersApprenants-bad-history-clean-antidated",
  createIndexes: "create-indexes",
  createEffectifsApprenantsCollection: "create-effectifs-apprenants-collection",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearDossiersApprenants: "clear-dossiersApprenants",
  clearDossiersApprenantsNetworks: "clear-dossiersApprenants-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  exportDataForVoeuxAffelnet: "export-data-for-voeuxAffelnet",
  repostLatestDossiersApprenantsReceived: "repost-latest-dossiersApprenants-received",
  warmUpCache: "warm-up-cache",
  retrieveRncp: "retrieve-rncp-in-tco-for-cfds",
  createErpUser: "users:create-erp-user",
  createUser: "users:create-user",
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
