const logger = require("../../../common/logger");
const config = require("config");
const { apiStatutsSeeder, administrator } = require("../../../common/roles");
const { fullSampleWithUpdates } = require("../../../../tests/data/sample");
const { createRandomStatutsCandidatsList } = require("../../../../tests/data/randomizedSample");
const { User } = require("../../../common/model/index");

const seedUsers = async (users) => {
  if ((await User.countDocuments({ username: config.users.defaultAdmin.name })) !== 0) {
    logger.info(`User ${config.users.defaultAdmin.name} already existing - no creation needed`);
  } else {
    logger.info(`Creating user ${config.users.defaultAdmin.name}`);
    await users.createUser(config.users.defaultAdmin.name, config.users.defaultAdmin.password, {
      permissions: [administrator],
    });
  }

  if ((await User.countDocuments({ username: config.users.ymag })) !== 0) {
    logger.info(`User ${config.users.ymag} already existing - no creation needed`);
  } else {
    logger.info(`Creating user ${config.users.ymag}`);
    await users.createUser(config.users.ymag, config.apiKeys.ymag, {
      permissions: [apiStatutsSeeder],
      apiKey: config.apiKeys.ymag,
    });
  }
};

const seedSample = async (statutsCandidats) => {
  await statutsCandidats.addOrUpdateStatuts(fullSampleWithUpdates);
};

const seedRandomizedSample = async (statutsCandidats) => {
  await statutsCandidats.addOrUpdateStatuts(createRandomStatutsCandidatsList());
};

module.exports = {
  seedUsers,
  seedSample,
  seedRandomizedSample,
};
