import { subDays } from "date-fns";

import logger from "@/common/logger";
import { jobEventsDb } from "@/common/model/collections";

/**
 * purge de la collection jobEvents
 */
export const purgeEvents = async (NB_DAYS_TO_KEEP = 15) => {
  const lastDateToKeep = subDays(new Date(), NB_DAYS_TO_KEEP);
  logger.info(`Purging JobEvent Job for data older than ${lastDateToKeep} ...`);
  await jobEventsDb().deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("End Purging JobEvent Job");
};