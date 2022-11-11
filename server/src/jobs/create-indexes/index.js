const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { createIndexes, dropIndexes } = require("../../common/model/indexes/index");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

runScript(async () => {
  logger.info("Drop all existing indexes...");
  await dropIndexes();
  logger.info("Create all indexes...");
  await createIndexes();
  logger.info("All indexes successfully created !");
}, JOB_NAMES.createIndexes);
