const { USER_EVENTS_ACTIONS } = require("../../../common/constants/userEventsConstants");
const logger = require("../../../common/logger");
const { UserEventModel } = require("../../../common/model");

const purgeStatutsImportsUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging dossiersApprenants Imports UserEvents ...`);
  await UserEventModel.deleteMany({
    date: { $lte: lastDateToKeep },
    type: "POST",
    action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
  });
  logger.info("... Purged dossiersApprenants Imports  UserEvents done !");
};

module.exports = {
  purgeStatutsImportsUserEvents,
};
