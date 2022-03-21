const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const { purgeStatutsImportsUserEvents } = require("./purgeStatutsImportsUserEvents");
const { purgeJobEvents } = require("./purgeJobEvents");

const { subDays } = require("date-fns");

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
}, JOB_NAMES.cfasRetrieveDataConnection);
