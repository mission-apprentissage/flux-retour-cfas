const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { StatutCandidat } = require("../../common/model");

runScript(async ({ db }) => {
  const nbStatuts = await StatutCandidat.countDocuments({});
  logger.info(`Db ${db.name} - Statuts Jeune count : ${nbStatuts}`);
});
