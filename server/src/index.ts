import "dotenv/config.js";
import server from "./http/server.js";
import logger from "./common/logger.js";
import config from "./config.js";
import createGlobalServices from "./services.js";
import { connectToMongodb, configureDbSchemaValidation } from "./common/mongodb.js";
import { modelDescriptors } from "./common/model/collections.js";

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"));
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"));

(async function () {
  try {
    logger.warn("Starting application");
    await connectToMongodb(config.mongodb.uri);
    await configureDbSchemaValidation(modelDescriptors);

    await createGlobalServices();

    const http = await server();
    http.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`));
  } catch (err) {
    logger.error(err, "Startup error");
    process.exit(1); // eslint-disable-line no-process-exit
  }
})();
