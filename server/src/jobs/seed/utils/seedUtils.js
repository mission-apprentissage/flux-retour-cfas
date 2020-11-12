const logger = require("../../../common/logger");
const config = require("config");
const { fullSampleWithUpdates } = require("../../../../tests/data/sample");
const { createRandomStatutsCandidatsList } = require("../../../../tests/data/randomizedSample");
const { User } = require("../../../common/model/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");

const seedUsers = async (usersModule) => {
  const users = Object.values(config.users);
  await asyncForEach(users, async (user) => {
    if ((await User.countDocuments({ username: user.name })) !== 0) {
      logger.info(`User ${user.name} already exists - no creation needed`);
    } else {
      logger.info(`Creating user ${user.name}`);
      try {
        await usersModule.createUser(user.name, user.password, {
          permissions: user.permissions,
          apiKey: user.apiKey,
        });
      } catch (err) {
        logger.error(err);
        logger.error(`Failed to create user ${user.name}`);
      }
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
