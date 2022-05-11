const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const { clearDossiersApprenants } = require("./utils/clearUtils");

runScript(async () => {
  logger.info("Suppression de tous les documents de la collection dossiersApprenants ....");
  await clearDossiersApprenants();
  logger.info("Tous les documents de la collection dossiersApprenant ont été supprimés avec succès !");
}, JOB_NAMES.clearDossiersApprenants);
