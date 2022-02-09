const logger = require("../../../common/logger");
const { JobEventModel } = require("../../../common/model");

const purgeJobEvents = async (lastDateToKeep) => {
  logger.info(`... Purging JobEvent data ...`);
  await JobEventModel.deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged JobEvent done !");
};

module.exports = {
  purgeJobEvents,
};
