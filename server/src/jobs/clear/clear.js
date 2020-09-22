const logger = require("../../common/logger");
const { User, SampleEntity } = require("../../common/model");

module.exports = async () => {
  await SampleEntity.deleteMany({});
  await User.deleteMany({});
  logger.info(`Users deleted`);
  logger.info(`SampleEntity deleted`);
};
