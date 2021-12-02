const logger = require("../../common/logger");
const { JobEvent } = require("../../common/model");

const purgeJobEvents = async (lastDateToKeep) => {
  logger.info(`... Purging JobEvent data ...`);
  await JobEvent.deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged JobEvent done !");
};

module.exports = {
  purgeJobEvents,
};
