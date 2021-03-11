const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { createIndexes } = require("../../common/indexes");
const { jobNames } = require("../../common/model/constants");

runScript(async ({ db }) => {
  logger.info("RUN Create all indexes");
  await createIndexes(db);
  logger.info("END Create all indexes");
}, jobNames.createIndexes);
