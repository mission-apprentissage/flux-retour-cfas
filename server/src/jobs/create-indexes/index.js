const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { createIndexes, dropIndexes } = require("../../common/indexes");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

runScript(async ({ db }) => {
  logger.info("RUN Create all indexes");
  await dropIndexes(db);
  await createIndexes(db);
  logger.info("END Create all indexes");
}, JOB_NAMES.createIndexes);
