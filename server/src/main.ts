import logger from "@/common/logger";
import { modelDescriptors } from "@/common/model/collections";
import config from "@/config";

import { startCLI } from "./commands";
import { connectToMongodb, configureDbSchemaValidation } from "./common/mongodb";
import createGlobalServices from "./services";

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"));
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"));

try {
  logger.warn("starting application");
  await connectToMongodb(config.mongodb.uri);
  await configureDbSchemaValidation(modelDescriptors); // à supprimer d'ici et mettre dans une commande distincte
  createGlobalServices();
  startCLI();
} catch (err) {
  logger.error({ err }, "startup error");
  process.exit(1); // eslint-disable-line no-process-exit
}
