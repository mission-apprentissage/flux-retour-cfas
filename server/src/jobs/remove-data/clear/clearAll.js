const { runScript } = require("../../scriptWrapper");
const { clearAll } = require("./utils/clearUtils");
const logger = require("../../../common/logger");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");

runScript(async () => {
  logger.info("Suppression de toutes les données ");
  await clearAll();
  logger.info("DossiersApprenants supprimés avec succès !");
}, JOB_NAMES.clearAll);
