const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { jobNames } = require("../../../common/model/constants");
const { StatutCandidatModel } = require("../../../common/model");

runScript(async () => {
  logger.info("Suppression des statutsCandidats avec formation_cfd invalide ....");
  await StatutCandidatModel.deleteMany({ formation_cfd_valid: false });
  logger.info("StatutsCandidats avec formation_cfd invalide nettoyés avec succès !");
}, jobNames.removeStatutsCandidatsInvalidCfd);
