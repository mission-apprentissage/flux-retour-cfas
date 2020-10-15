const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");

runScript(async ({ stats }) => {
  logger.info("-- Flux Retour Stats --");

  // Calcul stats
  const allStats = await stats.getAllStats();

  logger.info(`Nb de Statuts Candidats total : ${allStats.nbStatutsCandidats}`);
  logger.info(`Nb de Statuts Candidats Prospects total : ${allStats.nbStatutsProspect}`);
  logger.info(`Nb de Statuts Candidats Inscrits total : ${allStats.nbStatutsInscrits}`);
  logger.info(`Nb de Statuts Candidats Apprentis total : ${allStats.nbStatutsApprentis}`);
  logger.info(`Nb de Statuts Candidats Abandon total : ${allStats.nbStatutsAbandon}`);
  logger.info(`Nb de Statuts Candidats sans INE : ${allStats.nbStatutsSansIne}`);

  logger.info(" ");
  logger.info(`Nb de Candidats distinct sans INE: ${allStats.nbDistinctCandidatsWithoutIne}`);
  logger.info(`Nb de Candidats distinct avec INE: ${allStats.nbDistinctCandidatsWithIne}`);
  logger.info(
    `Nb de Candidats total : ${allStats.nbDistinctCandidatsWithIne + allStats.nbDistinctCandidatsWithoutIne}`
  );

  logger.info(" ");
  logger.info(`-> Nb de Statuts Candidats par UAIs ...`);
  await displayInLoggerNbStatutsCandidats(allStats.nbStatutsCandidatsParUais);

  logger.info(" ");
  logger.info(`-> Nb de Statuts Candidats Prospects par UAIs ...`);
  await displayInLoggerNbStatutsCandidats(allStats.nbStatutsCandidatsProspectsParUais, "prospects");

  logger.info(" ");
  logger.info(`-> Nb de Statuts Candidats Inscrits par UAIs ...`);
  await displayInLoggerNbStatutsCandidats(allStats.nbStatutsCandidatsInscritsParUais, "inscrits");

  logger.info(" ");
  logger.info(`-> Nb de Statuts Candidats Apprentis par UAIs ...`);
  await displayInLoggerNbStatutsCandidats(allStats.nbStatutsCandidatsApprentisParUais, "apprentis");

  logger.info(" ");
  logger.info(`-> Nb de Statuts Candidats Abandon par UAIs ...`);
  await displayInLoggerNbStatutsCandidats(allStats.nbStatutsCandidatsAbandonParUais, "abandon");

  logger.info(" ");
  logger.info(`Nb de Candidats sur plusieurs UAIs: ${allStats.nbCandidatsMultiUais}`);
});

const displayInLoggerNbStatutsCandidats = async (nbStatutsList, statut = "") => {
  await asyncForEach(nbStatutsList, async (currentItem) => {
    logger.info(
      `Pour l'UAI ${currentItem.uai_etablissement} on retrouve ${currentItem.nbStatutsCandidats} statuts candidats ${statut}`
    );
  });
};
