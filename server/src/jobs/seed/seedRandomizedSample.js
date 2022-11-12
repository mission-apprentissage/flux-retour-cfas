import { runScript } from '../scriptWrapper';
import logger from '../../common/logger';
import { seedRandomizedSample } from './utils/seedUtils';
import { JOB_NAMES } from '../../common/constants/jobsConstants';

runScript(async ({ dossiersApprenants }) => {
  logger.info("Seeding data with Randomized sample...");
  await seedRandomizedSample(dossiersApprenants);
  logger.info("End seeding data with Randomized sample !");
}, JOB_NAMES.seedRandomizedSample);
