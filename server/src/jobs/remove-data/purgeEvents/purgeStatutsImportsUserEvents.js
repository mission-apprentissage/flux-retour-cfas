const logger = require("../../../common/logger");
const { UserEventModel } = require("../../../common/model");

const purgeStatutsImportsUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging dossiersApprenants Imports UserEvents ...`);
  await UserEventModel.deleteMany({ date: { $lte: lastDateToKeep }, type: "POST", action: "statut-candidats" });
  logger.info("... Purged dossiersApprenants Imports  UserEvents done !");
};

module.exports = {
  purgeStatutsImportsUserEvents,
};
