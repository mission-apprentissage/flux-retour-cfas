const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { seedUsers } = require("./utils/seedUtils");
const { jobNames } = require("../../common/model/constants");

runScript(async ({ users }) => {
  logger.info("-> Seed Users...");
  await seedUsers(users);
  logger.info("-> All users are successfully created !");
}, jobNames.seedUsers);
