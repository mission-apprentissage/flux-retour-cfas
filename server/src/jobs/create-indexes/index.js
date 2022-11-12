import { runScript } from '../scriptWrapper';
import logger from '../../common/logger';
import { createIndexes, dropIndexes } from '../../common/model/indexes/index';
import { JOB_NAMES } from '../../common/constants/jobsConstants';

runScript(async () => {
  logger.info("Drop all existing indexes...");
  await dropIndexes();
  logger.info("Create all indexes...");
  await createIndexes();
  logger.info("All indexes successfully created !");
}, JOB_NAMES.createIndexes);
