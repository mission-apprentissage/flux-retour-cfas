const logger = require("../../common/logger");

module.exports = async (users) => {
  await users.createUser("testUser", "password");
  await users.createUser("testAdmin", "password", { permissions: { isAdmin: true } });
  logger.info(`User 'testUser' with password 'password' is successfully created `);
  logger.info(`User 'testAdmin' with password 'password' and admin is successfully created `);
};
