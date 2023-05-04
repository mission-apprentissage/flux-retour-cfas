import logger from "@/common/logger";
import { createIndexes, dropIndexes } from "@/common/model/indexes/index";

export const recreateIndexes = async ({ drop } = { drop: false }) => {
  if (drop) {
    logger.info("Drop all existing indexes...");
    await dropIndexes();
  }
  logger.info("Create all indexes...");
  await createIndexes();
  logger.info("All indexes successfully created !");
};
