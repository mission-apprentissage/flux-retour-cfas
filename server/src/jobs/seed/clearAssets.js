import path from "path";
import fs from "fs-extra";

import logger from "../../common/logger.js";
import { runScript } from "../scriptWrapper.js";
import { __dirname } from "../../common/utils/esmUtils.js";

/**
 * Script qui vide le dossier assets du job seed
 */
runScript(async () => {
  logger.info("Clearing assets from seed job ...");
  await fs.emptyDir(path.join(__dirname(import.meta.url), "./assets"));
  logger.info("All assets from seed job deleted !");
}, "clear-seed-assets");
