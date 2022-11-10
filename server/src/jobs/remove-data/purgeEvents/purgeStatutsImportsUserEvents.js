const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../../common/constants/userEventsConstants");
const logger = require("../../../common/logger");
const { userEventsDb } = require("../../../common/model/collections");

const purgeStatutsImportsUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging dossiersApprenants Imports UserEvents ...`);
  await userEventsDb().deleteMany({
    date: { $lte: lastDateToKeep },
    type: USER_EVENTS_TYPES.POST,
    action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
  });
  logger.info("... Purged dossiersApprenants Imports  UserEvents done !");
};

module.exports = {
  purgeStatutsImportsUserEvents,
};
