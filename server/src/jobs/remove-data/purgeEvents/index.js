import { runScript } from "../../scriptWrapper.js";
import logger from "../../../common/logger.js";
import { purgeStatutsImportsUserEvents } from "./purgeStatutsImportsUserEvents.js";
import { purgeJobEvents } from "./purgeJobEvents.js";
import { subDays } from "date-fns";

const NB_DAYS_TO_KEEP = 15;

/**
 * Ce script permet d'executer un job de purge des données inutiles
 */
runScript(async () => {
  const lastDateToKeep = subDays(new Date(), NB_DAYS_TO_KEEP);

  logger.info(`Running Purging Job for data older than ${lastDateToKeep} ...`);
  await purgeStatutsImportsUserEvents(lastDateToKeep);
  await purgeJobEvents(lastDateToKeep);
  logger.info("End Purging Job");
}, "purge-user-events");
