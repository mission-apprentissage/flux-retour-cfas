import { subDays } from "date-fns";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";

/**
 * purge de la collection effectifsQueue
 */
export const purgeQueues = async (NB_DAYS_TO_KEEP = 15) => {
  const lastDateToKeep = subDays(new Date(), NB_DAYS_TO_KEEP);
  logger.info(`Purging effectifsQueue for data older than ${lastDateToKeep} ...`);
  await effectifsQueueDb().deleteMany({ processed_at: { $lte: lastDateToKeep } });
  logger.info("End Purging effectifsQueue");
};
