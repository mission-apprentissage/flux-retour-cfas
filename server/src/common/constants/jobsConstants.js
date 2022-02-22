/**
 * Nom des jobs
 */
const jobNames = {
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
  removeStatutsCandidatsDuplicates: "remove-statutsCandidats-duplicates",
  formationRetrieveFromCfd: "formation-retrieve-from-cfd",
  statutsCandidatsRetrieveNetworks: "statutsCandidats-retrieve-networks",
  statutsCandidatsRetrieveNiveaux: "statutsCandidats-retrieve-niveaux",
  statutsCandidatsRetrieveSiretCatalog: "statutsCandidats-retrieve-siret-catalog",
  statutsCandidatsRetrieveFormationsInCatalog: "statutsCandidats-retrieve-formation-in-catalog",
  statutsCandidatsBadHistoryIdentifyAntidated: "statutsCandidats-bad-history-identify-antidated",
  statutsCandidatsBadHistoryCleanAntidated: "statutsCandidats-bad-history-clean-antidated",
  statutsCandidatsBadHistoryIdentifyBadDates: "statutsCandidats-bad-history-identify-badDates",
  createIndexes: "create-indexes",
  createRcoStatutsCollection: "create-rco-statuts-collection",
  clearUsers: "clear-users",
  clearCfas: "clear-cfas",
  clearStatutsCandidats: "clear-statuts-candidats",
  clearStatutsCandidatsNetworks: "clear-statuts-candidats-networks",
  clearLogs: "clear-logs",
  clearAll: "clear-all",
  cleanStatutsCandidats: "clean-statuts-candidats",
  removeStatutsCandidatsInvalidCfd: "remove-statuts-candidats-invalid-cfd",
  removeStatutsCandidatsInvalidUai: "remove-statuts-candidats-invalid-uai",
  cleanCfaDataFeedback: "clean-cfaDataFeedback",
  exportDataForVoeuxAffelnet: "export-data-for-voeuxAffelnet",
  cfasRetrieveDataConnection: "cfas-retrieve-data-connection",
  repostLastStatutsReceived: "repost-last-statuts-received",
  warmUpCache: "warm-up-cache",
  retrieveRncp: "retrieve-rncp-in-tco-for-cfds",
  statutsAvecDateIdentiqueDansHistorique: "statuts-avec-date-identique-dans-historique",
  statutsCandidatsRemoveHistoriqueElementWithInvalidValeurStatut:
    "statuts-candidats-remove-historique-element-with-invalid-valeur-statut",
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

module.exports = { jobNames, jobEventStatuts };
