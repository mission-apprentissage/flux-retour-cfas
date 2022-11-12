import { runScript } from '../scriptWrapper';
import logger from '../../common/logger';
import { seedSample } from './utils/seedUtils';
import { JOB_NAMES } from '../../common/constants/jobsConstants';

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Sample...");
  await seedSample(dossiersApprenants);
  logger.info("End seeding data with Sample !");
}, JOB_NAMES.seedSample);
