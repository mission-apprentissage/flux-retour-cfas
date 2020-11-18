const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const buildStats = require("./import/buildStats");
const { DsStats } = require("../../common/model");

runScript(async () => {
  logger.info("Génération des stats des données DS");

  const statsInDb = await DsStats.countDocuments({});
  if (statsInDb !== 0) {
    logger.info(`-> ${statsInDb} stats déja en base - clean de la bdd ...`);
    await DsStats.deleteMany({});
  }

  await buildStats();
  logger.info("Fin de la génération des stats des données DS");
});
