const logger = require("../../../../common/logger");
const { UserModel, StatutCandidatModel, LogModel, UserEventModel, CfaModel } = require("../../../../common/model");

const clearAll = async () => {
  logger.info("Suppression en cours");

  await StatutCandidatModel.deleteMany({});
  logger.info(`StatutsCandidats supprimés`);

  await UserModel.deleteMany({});
  logger.info(`Users supprimés`);
};

const clearStatutsCandidats = async () => {
  logger.info("Suppression en cours");
  await StatutCandidatModel.deleteMany({});
  logger.info(`StatutsCandidats supprimés`);
};

const clearUsers = async () => {
  logger.info("Suppression en cours");

  await UserModel.deleteMany({});
  logger.info(`Users supprimés`);

  await UserEventModel.deleteMany({});
  logger.info(`UserEvents supprimés`);
};

const clearCfas = async () => {
  logger.info("Suppression en cours");

  await CfaModel.deleteMany({});
  logger.info(`Cfas supprimés`);
};

const clearLogsAndEvents = async () => {
  logger.info("Suppression en cours");

  await LogModel.deleteMany({});
  logger.info(`Logs supprimés`);

  await UserEventModel.deleteMany({});
  logger.info(`UserEvents supprimés`);
};
module.exports = {
  clearAll,
  clearStatutsCandidats,
  clearUsers,
  clearLogsAndEvents,
  clearCfas,
};
