import logger from "../../../common/logger.js";
import { jobEventsDb } from "../../../common/model/collections.js";

const purgeJobEvents = async (lastDateToKeep) => {
  logger.info(`... Purging JobEvent data ...`);
  await jobEventsDb().deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged JobEvent done !");
};

export default {
  purgeJobEvents,
};
