import logger from "@/common/logger";
import { modelDescriptors } from "@/common/model/collections";

import { startCLI } from "./commands";
import { connectToMongodb, configureDbSchemaValidation, getMongodbUri } from "./common/mongodb";
import { setupJobProcessor } from "./jobs/jobs";
import createGlobalServices from "./services";

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"));
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"));

try {
  logger.warn("starting application");
  await connectToMongodb(getMongodbUri());
  await configureDbSchemaValidation(modelDescriptors); // à supprimer d'ici et mettre dans une commande distincte

  // We need to setup even for server to be able to call addJob
  await setupJobProcessor();
  createGlobalServices();
  await startCLI();
} catch (err) {
  logger.error({ err }, "startup error");
  process.exit(1); // eslint-disable-line no-process-exit
}
