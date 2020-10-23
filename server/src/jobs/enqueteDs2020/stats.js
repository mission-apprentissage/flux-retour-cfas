const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const createStatsEnqueteDs = require("../../logic/enqueteDs/statsEnqueteDs");

runScript(async () => {
  logger.info("Stats from DS 2020");

  const statsDs = await createStatsEnqueteDs();
  logger.info(JSON.stringify(statsDs.stats));

  logger.info("End stats from DS 2020");
});
