import logger from "../../common/logger.js";
import { createIndexes, dropIndexes } from "../../common/model/indexes/index.js";

export const recreateIndexes = async () => {
  logger.info("Drop all existing indexes...");
  await dropIndexes();
  logger.info("Create all indexes...");
  await createIndexes();
  logger.info("All indexes successfully created !");
};
