const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { createIndexes } = require("../../common/indexes");

runScript(async ({ db }) => {
  logger.info("RUN Create all indexes");
  await createIndexes(db);
  logger.info("END Create all indexes");
});
