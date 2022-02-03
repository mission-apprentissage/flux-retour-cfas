const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { jobNames } = require("../../../common/model/constants");
const { StatutCandidatModel } = require("../../../common/model");

runScript(async () => {
  logger.info("Suppression des statutsCandidats avec uai_etablissement invalide ....");
  await StatutCandidatModel.deleteMany({ uai_etablissement_valid: false });
  logger.info("StatutsCandidats avec uai_etablissement invalide nettoyés avec succès !");
}, jobNames.removeStatutsCandidatsInvalidUai);
