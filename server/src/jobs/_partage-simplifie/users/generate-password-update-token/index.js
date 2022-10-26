const logger = require("../../../../common/logger.js");

const runGeneratePasswordUpdateToken = async (partageSimplifieUsers, { email }) => {
  logger.info(`Will create password update token for user ${email}`);

  const token = await partageSimplifieUsers.generatePasswordUpdateToken(email);

  logger.info(`Password update token for user ${email} successfully created -> ${token}`);
  logger.info(`Password update link -> ${partageSimplifieUsers.getUpdatePasswordLink(token)}`);
};

module.exports = { runGeneratePasswordUpdateToken };
