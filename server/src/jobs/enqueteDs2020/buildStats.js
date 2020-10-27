const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const createStatsEnqueteDs = require("./statsUtils/statsModule");
const fs = require("fs");
const path = require("path");

runScript(async () => {
  logger.info("Stats from DS 2020");
  const statsDs = await createStatsEnqueteDs(true);

  // Export to Json
  fs.writeFile(path.join(__dirname, "./output/statsEnqueteDs.json"), JSON.stringify(statsDs), (err) => {
    if (err) logger.info(err);
  });

  logger.info("End stats from DS 2020");
});
