const logger = require("../../common/logger");
const { User, StatutCandidat } = require("../../common/model");

module.exports = async () => {
  await StatutCandidat.deleteMany({});
  await User.deleteMany({});
  logger.info(`Users deleted`);
  logger.info(`StatutCandidat deleted`);
};
