const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const config = require("../../../config/index");

runScript(async () => {
  logger.info("Run Tests");
  logger.info(`ENV : ${config.env}`);
  logger.info("End Tests");
});
