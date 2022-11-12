import logger from '../../../common/logger';
import { jobEventsDb } from '../../../common/model/collections';

const purgeJobEvents = async (lastDateToKeep) => {
  logger.info(`... Purging JobEvent data ...`);
  await jobEventsDb().deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged JobEvent done !");
};

export default {
  purgeJobEvents,
};
