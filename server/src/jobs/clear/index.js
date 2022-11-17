import { clearAllCollections } from "../../common/mongodb.js";
import logger from "../../common/logger.js";

export const clear = async ({ clearAll }) => {
  if (clearAll) {
    await clearAllCollections();
  }
  logger.info(`Clear flux-retour-cfas done`);
};
