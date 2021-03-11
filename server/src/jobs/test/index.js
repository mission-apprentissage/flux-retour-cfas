const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const config = require("../../../config/index");
const { jobNames } = require("../../common/model/constants");

runScript(async () => {
  logger.info("Run Tests");
  logger.info(`ENV : ${config.env}`);
  logger.info("End Tests");
}, jobNames.test);
