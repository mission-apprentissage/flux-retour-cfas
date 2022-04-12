/**
 * Nom des jobs
 */
const JOB_NAMES = {
  seedSample: "seed-sample",
  seedCfas: "seed-cfas",
  seedReferentielCfas: "seed-referentiel-cfas",
  seedAnnuaireCfas: "seed-annuaire-cfas",
  clearSeedAssets: "clear-seed-assets",
  seedCroisementCfasAnnuaire: "seed-croisement-cfas-annuaire",
  seedRandomizedSample: "seed-randomized-sample",
  identifyUaisInCatalog: "identify-uais-types-catalog",
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
  createIndexes: "create-indexes",
  createEffectifsApprenantsCollection: "create-effectifs-apprenants-collection",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearDossiersApprenants: "clear-statuts-candidats",
  clearDossiersApprenantsNetworks: "clear-statuts-candidats-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  exportDataForVoeuxAffelnet: "export-data-for-voeuxAffelnet",
  repostLastStatutsReceived: "repost-last-statuts-received",
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
