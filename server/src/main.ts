import { captureException } from "@sentry/node";

import logger from "@/common/logger";
import { modelDescriptors } from "@/common/model/collections";

import { startCLI } from "./commands";
import { connectToMongodb, configureDbSchemaValidation, getMongodbUri } from "./common/mongodb";
import { closeSentry, initSentryProcessor } from "./common/services/sentry/sentry";
import { setupJobProcessor } from "./jobs/jobs";
import createGlobalServices from "./services";

// Avant le démarrage : les échecs ci-dessous précèdent le hook preAction des commandes,
// qui initialisait Sentry jusqu'ici — ils partaient donc dans un trou noir.
initSentryProcessor();

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "unhandledRejection");
  captureException(err);
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaughtException");
  captureException(err);
});

try {
  logger.warn("starting application");
  await connectToMongodb(getMongodbUri());
  await configureDbSchemaValidation(modelDescriptors); // à supprimer d'ici et mettre dans une commande distincte

  await setupJobProcessor();
  createGlobalServices();
  await startCLI();
} catch (err) {
  logger.error({ err }, "startup error");
  captureException(err);
  await closeSentry();
  process.exit(1); // eslint-disable-line no-process-exit
}
