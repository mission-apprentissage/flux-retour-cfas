const logger = require("../../../common/logger");
const { User, StatutCandidat } = require("../../../common/model");

const clearAll = async () => {
  logger.info("Suppression en cours");

  await StatutCandidat.deleteMany({});
  logger.info(`StatutsCandidats supprimés`);

  await User.deleteMany({});
  logger.info(`Users supprimés`);
};

const clearStatutsCandidats = async () => {
  logger.info("Suppression en cours");
  await StatutCandidat.deleteMany({});
  logger.info(`StatutsCandidats supprimés`);
};

module.exports = {
  clearAll,
  clearStatutsCandidats,
};
