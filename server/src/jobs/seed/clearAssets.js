const path = require("path");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

const fs = require("fs-extra");

/**
 * Script qui vide le dossier assets du job seed
 */
runScript(async () => {
  logger.info("Clearing assets from seed job ...");
  await fs.emptyDir(path.join(__dirname, `./assets`));
  logger.info("All assets from seed job deleted !");
}, JOB_NAMES.clearSeedAssets);
