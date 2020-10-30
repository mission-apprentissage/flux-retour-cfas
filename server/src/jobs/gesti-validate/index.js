const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");

const validateCfds = require("./cfd/validateCfd");
const validateMefs = require("./mef/validateMef");
const validateUais = require("./uai/validateUai");

/* Ce script permet de valider les données Gesti */

runScript(async () => {
  logger.info("Run Gesti data verification");

  await validateUais();
  await validateCfds();
  await validateMefs();

  logger.info("End Gesti data verification");
});
