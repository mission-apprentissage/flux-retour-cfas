const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { createIndexes, dropIndexes } = require("../../common/indexes");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

runScript(async ({ db }) => {
  logger.info("Drop all existing indexes...");
  await dropIndexes(db);
  logger.info("Create all indexes...");
  await createIndexes(db);
  logger.info("All indexes successfully created !");
}, JOB_NAMES.createIndexes);
