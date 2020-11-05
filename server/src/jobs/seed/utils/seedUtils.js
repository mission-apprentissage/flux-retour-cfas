const logger = require("../../../common/logger");
const config = require("config");
const { apiStatutsSeeder, administrator } = require("../../../common/roles");
const { fullSampleWithUpdates } = require("../../../../tests/data/sample");
const { createRandomStatutsCandidatsList } = require("../../../../tests/data/randomizedSample");
const { User } = require("../../../common/model/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");

const seedUsers = async (users) => {
  if ((await User.countDocuments({ username: config.users.defaultAdmin.name })) !== 0) {
    logger.info(`User ${config.users.defaultAdmin.name} already existing - no creation needed`);
  } else {
    logger.info(`Creating user ${config.users.defaultAdmin.name}`);
    await users.createUser(config.users.defaultAdmin.name, config.users.defaultAdmin.password, {
      permissions: [administrator],
    });
  }

  // data providers (ymag, gesti)
  const usersExcludingDefaultAdmin = Object.keys(config.users)
    .filter((name) => name !== "defaultAdmin")
    .map((userKey) => config.users[userKey]);
  await asyncForEach(usersExcludingDefaultAdmin, async (user) => {
    if ((await User.countDocuments({ username: user.name })) !== 0) {
      logger.info(`User ${user.name} already existing - no creation needed`);
    } else {
      logger.info(`Creating user ${user.name}`);
      await users.createUser(user.name, user.password, {
        permissions: [apiStatutsSeeder],
        apiKey: user.apiKey,
      });
    }
  });
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
