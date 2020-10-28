const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const createStatsEnqueteDs = require("./stats/statsModule");
const fs = require("fs");
const path = require("path");

const statsFileName = "statsEnqueteDs.json";
const localStatsFilePath = path.join(__dirname, `./stats/output/${statsFileName}`);

runScript(async () => {
  logger.info("Building stats from DS 2020");
  const statsDs = await createStatsEnqueteDs();

  // Export to Json local file
  logger.info(`Saving stats to Json File ${statsFileName}...`);
  fs.writeFile(localStatsFilePath, JSON.stringify(statsDs), (err) => {
    if (err) logger.info(err);
  });

  logger.info("End building stats from DS 2020");
});
