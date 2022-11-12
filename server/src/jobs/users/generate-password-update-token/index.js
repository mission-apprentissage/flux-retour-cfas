import { runScript } from '../../scriptWrapper';
import logger from '../../../common/logger';
import { JOB_NAMES } from '../../../common/constants/jobsConstants';
import arg from 'arg';
import config from '../../../../config';

let args = [];

runScript(async ({ users }) => {
  args = arg({ "--username": String }, { argv: process.argv.slice(2) });
  const username = args["--username"];

  logger.info(`Will create password update token for user ${username}`);

  if (!username) {
    throw new Error("--username required argument is missing");
  }

  const token = await users.generatePasswordUpdateToken(username);

  logger.info(`Password update token for user ${username} successfully created -> ${token}`);
  logger.info(`Password update link -> ${config.publicUrl}/modifier-mot-de-passe?token=${token}`);
}, JOB_NAMES.generatePasswordUpdateToken);
