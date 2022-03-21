const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const arg = require("arg");
const { apiRoles, tdbRoles } = require("../../../common/roles");

let args = [];

runScript(async ({ users }) => {
  args = arg({ "--username": String }, { argv: process.argv.slice(2) });
  const username = args["--username"];

  logger.info(`Will create ERP user ${username}`);

  if (!username) {
    throw new Error("--username required argument is missing");
  }

  await users.createUser({
    username,
    permissions: [apiRoles.apiStatutsSeeder, tdbRoles.pilot],
  });

  logger.info(`User ${username} successfully created`);
}, JOB_NAMES.createErpUser);
