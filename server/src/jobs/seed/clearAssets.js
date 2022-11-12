import path from 'path';
import logger from '../../common/logger';
import { runScript } from '../scriptWrapper';
import { JOB_NAMES } from '../../common/constants/jobsConstants';
import fs from 'fs-extra';

/**
 * Script qui vide le dossier assets du job seed
 */
runScript(async () => {
  logger.info("Clearing assets from seed job ...");
  await fs.emptyDir(path.join(__dirname, `./assets`));
  logger.info("All assets from seed job deleted !");
}, JOB_NAMES.clearSeedAssets);
