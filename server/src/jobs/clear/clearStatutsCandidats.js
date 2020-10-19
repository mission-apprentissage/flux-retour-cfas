const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { clearStatutsCandidats } = require("./utils/clearUtils");

runScript(async () => {
  logger.info("Suppression de tous les statutsCandidats ....");
  await clearStatutsCandidats();
  logger.info("StatutsCandidats supprimés avec succès !");
});
