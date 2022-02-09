const logger = require("../../../common/logger");
const { UserEventModel } = require("../../../common/model");

const purgeUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging UserEvents ...`);
  await UserEventModel.deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged UserEvents done !");
};

module.exports = {
  purgeUserEvents,
};
