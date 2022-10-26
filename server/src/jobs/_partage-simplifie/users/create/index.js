const logger = require("../../../../common/logger.js");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../common/roles.js");

const runCreateUser = async (users, { email, role }) => {
  logger.info(`Will create partage-simplifie user ${email} and role ${role} `);

  if (!Object.values(PARTAGE_SIMPLIFIE_ROLES).some((item) => item === role)) {
    throw new Error(`Role ${role} doesn't exists !`);
  }

  await users.createUser({ email, role });
  logger.info(`User ${email} successfully created with role ${role}`);
};

module.exports = { runCreateUser };
