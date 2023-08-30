import fs from "fs-extra";

import logger from "@/common/logger";
import { __dirname } from "@/common/utils/esmUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

/**
 * Script qui vide le dossier assets du job seed
 */
export async function clearSeedAssets() {
  logger.info("Clearing assets from seed job ...");
  await fs.emptyDir(getStaticFilePath("./seed"));
  logger.info("All assets from seed job deleted !");
}
