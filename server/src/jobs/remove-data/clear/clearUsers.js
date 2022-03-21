const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { clearUsers } = require("./utils/clearUtils");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");

runScript(async () => {
  logger.info("Suppression de tous les users & usersEvents ....");
  await clearUsers();
  logger.info("Users & UsersEvent supprimés avec succès !");
}, JOB_NAMES.clearUsers);
