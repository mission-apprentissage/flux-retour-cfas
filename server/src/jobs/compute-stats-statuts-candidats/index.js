const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const config = require("../../../config");

const logStats = (stats = {}) => {
  logger.info(`Nb de Statuts Candidats total : ${stats.nbStatutsCandidats}`);
  logger.info(`Nb de Statuts Candidats mis à jour : ${stats.nbStatutsCandidatsMisAJour}`);
  logger.info(`Nb de Statuts Candidats Prospects total : ${stats.nbStatutsProspect}`);
  logger.info(`Nb de Statuts Candidats Inscrits total : ${stats.nbStatutsInscrits}`);
  logger.info(`Nb de Statuts Candidats Apprentis total : ${stats.nbStatutsApprentis}`);
  logger.info(`Nb de Statuts Candidats Abandon total : ${stats.nbStatutsAbandon}`);
  logger.info(`Nb de Statuts Candidats sans INE : ${stats.nbStatutsSansIne}`);

  logger.info(" ");
  logger.info(`Nb de Candidats distinct sans INE: ${stats.nbDistinctCandidatsWithoutIne}`);
  logger.info(`Nb de Candidats distinct avec INE: ${stats.nbDistinctCandidatsWithIne}`);
  logger.info(`Nb de Candidats total : ${stats.nbDistinctCandidatsTotal}`);

  logger.info(" ");
  logger.info(`Nb de Candidats sur plusieurs UAIs avec INE: ${stats.nbCandidatsMultiUaisWithIne}`);
  logger.info(`Nb de Candidats sur plusieurs UAIs sans INE: ${stats.nbCandidatsMultiUaisWithoutIne}`);
  logger.info(`Nb de Candidats sur plusieurs CFS avec INE: ${stats.nbCandidatsMultiCfdsWithIne}`);
  logger.info(`Nb de Candidats sur plusieurs CFS sans INE: ${stats.nbCandidatsMultiCfdsWithoutIne}`);

  logger.info(" ");
  logger.info(`Nb de Statuts sans historique : ${stats.nbStatutsWithoutHistory}`);
  logger.info(`Nb de Candidats avec 1 changement statut : ${stats.nbDistinctCandidatsWithStatutHistory1}`);
  logger.info(`Nb de Candidats avec 2 changements statut : ${stats.nbDistinctCandidatsWithStatutHistory2}`);
  logger.info(`Nb de Candidats avec 3 changements statut : ${stats.nbDistinctCandidatsWithStatutHistory3}`);

  logger.info(
    `Nb de Candidats avec changements statut Prospect / Inscrit : ${stats.nbDistinctCandidatsWithChangingStatutProspectInscrit}`
  );
  logger.info(
    `Nb de Candidats avec changements statut Prospect / Apprenti : ${stats.nbDistinctCandidatsWithChangingStatutProspectApprenti}`
  );
  logger.info(
    `Nb de Candidats avec changements statut Prospect / Abandon : ${stats.nbDistinctCandidatsWithChangingStatutProspectAbandon}`
  );
  logger.info(`Nb CFAs : ${stats.nbCfas}`);
  logger.info(`Nb UAIs invalids : ${stats.nbInvalidUais}`);
};

runScript(async ({ stats }) => {
  logger.info("--- Flux Retour Stats ---");

  // Calcul stats
  const allStats = await stats.getAllStats();
  const gestiStats = await stats.getAllStats({ source: config.users.gesti.name });
  const ymagStats = await stats.getAllStats({ source: config.users.ymag.name });

  logger.info("--- Stats globales ---");
  logStats(allStats);
  logger.info("------------------");

  logger.info("--- Stats Gesti ---");
  logStats(gestiStats);
  logger.info("------------------");

  logger.info("--- Stats Ymag ---");
  logStats(ymagStats);
  logger.info("------------------");
});
