const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { clearLogsAndEvents } = require("./utils/clearUtils");
const { jobNames } = require("../../../common/constants/jobsConstants");

runScript(async () => {
  logger.info("Suppression de tous les logs ....");
  await clearLogsAndEvents();
  logger.info("Logs supprimés avec succès !");
}, jobNames.clearLogs);
