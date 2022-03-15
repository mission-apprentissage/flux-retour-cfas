const { runScript } = require("../../scriptWrapper");
const { clearAll } = require("./utils/clearUtils");
const logger = require("../../../common/logger");
const { jobNames } = require("../../../common/constants/jobsConstants");

runScript(async () => {
  logger.info("Suppression de toutes les données ");
  await clearAll();
  logger.info("DossiersApprenants supprimés avec succès !");
}, jobNames.clearAll);
