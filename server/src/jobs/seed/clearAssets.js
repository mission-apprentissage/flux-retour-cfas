import path from "path";
import logger from "../../common/logger.js";
import { runScript } from "../scriptWrapper.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";
import fs from "fs-extra";
import { getDirname } from "../../common/utils/esmUtils.js";

/**
 * Script qui vide le dossier assets du job seed
 */
runScript(async () => {
  logger.info("Clearing assets from seed job ...");
  await fs.emptyDir(path.join(getDirname(import.meta.url), `./assets`));
  logger.info("All assets from seed job deleted !");
}, JOB_NAMES.clearSeedAssets);
