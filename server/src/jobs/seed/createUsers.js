const logger = require("../../common/logger");
const { role1, role2, administrator } = require("../../common/roles");

module.exports = async (users) => {
  await users.createUser("testUser", "password");
  await users.createUser("testRole1", "password", { permissions: [role1] });
  await users.createUser("testRole1And2", "password", { permissions: [role1, role2] });
  await users.createUser("testAdmin", "password", { permissions: [administrator] });

  logger.info(`User 'testUser' with password 'password' is successfully created `);
  logger.info(`User 'testRole1' with password 'password' and role1 is successfully created `);
  logger.info(`User 'testRole1And2' with password 'password' and role1 & role2 is successfully created `);
  logger.info(`User 'testAdmin' with password 'password' and admin is successfully created `);
};
