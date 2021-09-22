const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { jobNames, statsTypes, dataSource } = require("../../common/model/constants/index");
const { Stats } = require("../../common/model");

/**
 * Ce script permet de calculer les statistiques
 */
runScript(async ({ stats }) => {
  // Add global stats
  logger.info(`Calculating Global Stats`);
  await calculateDataSourceGlobalStats(stats, dataSource.all);

  // Add ymag stats
  logger.info(`Calculating Ymag Stats`);
  await calculateDataSourceGlobalStats(stats, dataSource.ymag);

  // Add gesti stats
  logger.info(`Calculating Gesti Stats`);
  await calculateDataSourceGlobalStats(stats, dataSource.gesti);

  // Add networks stats
  logger.info(`Calculating Network Stats`);
  await calculateNetworksStats(stats);

  logger.info("Ended !");
}, jobNames.calculateStats);

/**
 * Calcul les stats globales pour une source
 */
const calculateDataSourceGlobalStats = async (stats, inputSource) => {
  const allStats =
    inputSource === dataSource.all ? await stats.getAllStats() : await stats.getAllStats({ source: inputSource });
  await new Stats({
    type: statsTypes.tdbStats,
    dataSource: inputSource,
    date: new Date(),
    data: allStats,
  }).save();
};

/**
 * Calcul les stats de réseaux
 * @param {*} stats
 */
const calculateNetworksStats = async (stats) => {
  const networksStats = await stats.getNetworkStats();
  await new Stats({
    type: statsTypes.networksStats,
    date: new Date(),
    data: networksStats,
  }).save();
};
