const logger = require("../../../common/logger");
const { jobEventsDb } = require("../../../common/model/collections");

const purgeJobEvents = async (lastDateToKeep) => {
  logger.info(`... Purging JobEvent data ...`);
  await jobEventsDb().deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged JobEvent done !");
};

module.exports = {
  purgeJobEvents,
};
