const logger = require("../../../common/logger");
const { UserEventModel } = require("../../../common/model");

const purgeStatutsImportsUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging Statuts Candidats Imports UserEvents ...`);
  await UserEventModel.deleteMany({ date: { $lte: lastDateToKeep }, type: "POST", action: "statut-candidats" });
  logger.info("... Purged Statuts Candidats Imports  UserEvents done !");
};

module.exports = {
  purgeStatutsImportsUserEvents,
};
