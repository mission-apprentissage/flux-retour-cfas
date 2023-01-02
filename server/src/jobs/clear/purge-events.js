import logger from "../../common/logger.js";
import { subDays } from "date-fns";
import { jobEventsDb, userEventsDb } from "../../common/model/collections.js";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../common/constants/userEventsConstants.js";

/**
 * Ce script de purger des données inutiles : les jobEvents et les usersEvents de post de dossiers
 */
export const purgeEvents = async (NB_DAYS_TO_KEEP = 15) => {
  const lastDateToKeep = subDays(new Date(), NB_DAYS_TO_KEEP);

  logger.info(`Running Purging Job for data older than ${lastDateToKeep} ...`);
  await purgeDossiersImportsUserEvents(lastDateToKeep);
  await purgeJobEvents(lastDateToKeep);
  logger.info("End Purging Job");
};

/**
 * Purge des jobsEvents
 * @param {*} lastDateToKeep
 */
const purgeJobEvents = async (lastDateToKeep) => {
  logger.info(`... Purging JobEvent data ...`);
  await jobEventsDb().deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged JobEvent done !");
};

/**
 *  Purge des envois des dossiersApprenants dans userEvents
 * @param {*} lastDateToKeep
 */
const purgeDossiersImportsUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging dossiersApprenants Imports UserEvents ...`);
  await userEventsDb().deleteMany({
    date: { $lte: lastDateToKeep },
    type: USER_EVENTS_TYPES.POST,
    action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
  });
  logger.info("... Purged dossiersApprenants Imports  UserEvents done !");
};
