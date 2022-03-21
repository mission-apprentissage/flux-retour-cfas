const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const { clearDossiersApprenants } = require("./utils/clearUtils");

runScript(async () => {
  logger.info("Suppression de tous les DossierApprenant ....");
  await clearDossiersApprenants();
  logger.info("DossiersApprenants supprimés avec succès !");
}, JOB_NAMES.clearDossiersApprenants);
