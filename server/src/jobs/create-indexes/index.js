import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import { createIndexes, dropIndexes } from "../../common/model/indexes/index.js";

runScript(async () => {
  logger.info("Drop all existing indexes...");
  await dropIndexes();
  logger.info("Create all indexes...");
  await createIndexes();
  logger.info("All indexes successfully created !");
}, "create-indexes");
