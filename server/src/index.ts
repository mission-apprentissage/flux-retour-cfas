import "dotenv/config";
import server from "./http/server";
import logger from "./common/logger";
import config from "./config";
import createServices from "./services";
import { connectToMongodb, configureDbSchemaValidation } from "./common/mongodb";
import { modelDescriptors } from "./common/model/collections";

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  await connectToMongodb(config.mongodb.uri);
  await configureDbSchemaValidation(modelDescriptors);

  const services = await createServices();

  const http = await server(services);
  http.listen(5000, () => logger.info(`${config.appName} - Server ready and listening on port ${5000}`));
})();
