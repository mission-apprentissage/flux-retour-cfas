import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../../common/constants/userEventsConstants.js";
import logger from "../../../common/logger.js";
import { userEventsDb } from "../../../common/model/collections.js";

const purgeStatutsImportsUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging dossiersApprenants Imports UserEvents ...`);
  await userEventsDb().deleteMany({
    date: { $lte: lastDateToKeep },
    type: USER_EVENTS_TYPES.POST,
    action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
  });
  logger.info("... Purged dossiersApprenants Imports  UserEvents done !");
};

export default {
  purgeStatutsImportsUserEvents,
};
