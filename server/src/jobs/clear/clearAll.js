const { runScript } = require("../scriptWrapper");
const { clearAll } = require("./utils/clearUtils");
const logger = require("../../common/logger");
const { jobNames } = require("../../common/model/constants");

runScript(async () => {
  logger.info("Suppression de toutes les données ");
  await clearAll();
  logger.info("StatutsCandidats supprimés avec succès !");
}, jobNames.clearAll);
