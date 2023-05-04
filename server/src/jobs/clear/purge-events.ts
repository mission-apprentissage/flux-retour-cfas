import Logger from "bunyan";
import { subDays } from "date-fns";

import { jobEventsDb } from "@/common/model/collections";

/**
 * Ce script de purger des données inutiles : les jobEvents et les usersEvents de post de dossiers
 */
export const purgeEvents = async (logger: Logger, { nbDaysToKeep }: { nbDaysToKeep: number }) => {
  const lastDateToKeep = subDays(new Date(), nbDaysToKeep);
  logger.info(`Purging JobEvent Job for data older than ${lastDateToKeep} ...`);
  await jobEventsDb().deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("End Purging JobEvent Job");
};
