import path from "path";

import fs from "fs-extra";

import logger from "@/common/logger";
import { __dirname } from "@/common/utils/esmUtils";

/**
 * Script qui vide le dossier assets du job seed
 */
export async function clearSeedAssets() {
  logger.info("Clearing assets from seed job ...");
  await fs.emptyDir(path.join(__dirname(import.meta.url), "./assets"));
  logger.info("All assets from seed job deleted !");
}
