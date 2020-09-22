const logger = require("../../common/logger");
const { apiStatutsSeeder, administrator } = require("../../common/roles");
const config = require("config");

module.exports = async (users) => {
  await users.createUser("testUser", "password");
  await createYmag(users);
  await createDefaultAdmin(users);
  logger.info(`All users are successfully created `);
};

const createYmag = async (users) => {
  await users.createUser("ymag", config.apiKeys.ymag, { permissions: [apiStatutsSeeder], apiKey: config.apiKeys.ymag });
};

const createDefaultAdmin = async (users) => {
  await users.createUser("testAdmin", "mna-password", { permissions: [administrator] });
};
