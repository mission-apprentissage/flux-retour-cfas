import "dotenv/config";
import server from "./http/server.js";
import logger from "./common/logger.js";
import config from "./config.js";
import createServices from "./services.js";
import { connectToMongodb, configureDbSchemaValidation } from "./common/mongodb.js";
import { modelDescriptors } from "./common/model/collections.js";

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  await connectToMongodb(config.mongodb.uri);
  await configureDbSchemaValidation(modelDescriptors);

  const services = await createServices();

  const http = await server(services);
  http.listen(5000, () => logger.info(`${config.appName} - Server ready and listening on port ${5000}`));
})();
