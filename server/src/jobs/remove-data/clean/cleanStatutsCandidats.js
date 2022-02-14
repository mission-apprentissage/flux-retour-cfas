const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { jobNames } = require("../../../common/model/constants");
const { StatutCandidatModel } = require("../../../common/model");

const ABANDON_PROSPECTS_CODE = 4;

runScript(async () => {
  logger.info("Nettoyage des statutsCandidats ....");
  await removeStatutsAbandonsProspects();
  logger.info("StatutsCandidats nettoyés avec succès !");
}, jobNames.cleanStatutsCandidats);

const removeStatutsAbandonsProspects = async () => {
  logger.info("Suppression des statutsCandidats abandons de prospects ....");
  await StatutCandidatModel.deleteMany({ statut_apprenant: ABANDON_PROSPECTS_CODE });
  logger.info("StatutsCandidats abandons de prospects supprimés ");
};
