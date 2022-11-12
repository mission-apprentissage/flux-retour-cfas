import { runScript } from '../../scriptWrapper';
import logger from '../../../common/logger';
import { JOB_NAMES } from '../../../common/constants/jobsConstants';
import arg from 'arg';
import { apiRoles, tdbRoles } from '../../../common/roles';

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
