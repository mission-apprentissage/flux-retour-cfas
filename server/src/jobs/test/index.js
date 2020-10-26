const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");

runScript(async () => {
  logger.info("Run Tests");
  logger.info("End Tests");
});
