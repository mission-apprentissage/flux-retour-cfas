const logger = require("../../common/logger");
const { UserEvent } = require("../../common/model");

const purgeUserEvents = async (lastDateToKeep) => {
  logger.info(`... Purging UserEvents ...`);
  await UserEvent.deleteMany({ date: { $lte: lastDateToKeep } });
  logger.info("... Purged UserEvents done !");
};

module.exports = {
  purgeUserEvents,
};
