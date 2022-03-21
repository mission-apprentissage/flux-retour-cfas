const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { clearCfas } = require("./utils/clearUtils");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");

runScript(async () => {
  logger.info("Suppression de tous les cfas ....");
  await clearCfas();
  logger.info("Cfas supprimés avec succès !");
}, JOB_NAMES.clearCfas);
