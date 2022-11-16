import server from "./http/server.js";
import logger from "./common/logger.js";
import config from "../config/index.js";
import { initRedis } from "./common/infra/redis/index.js";
import createComponents from "./common/components/components.js";
import { connectToMongodb, getDatabase, configureDbSchemaValidation } from "./common/mongodb.js";
import { modelDescriptors } from "./common/model/collections.js";

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  // redis
  const redisClient = await initRedis({
    uri: config.redis.uri,
    onError: (err) => logger.error("Redis client error", err),
    onReady: () => logger.info("Redis client ready!"),
  });

  await connectToMongodb(config.mongodb.uri);
  await configureDbSchemaValidation(modelDescriptors);
  const db = getDatabase();

  const components = await createComponents({ db, redisClient });

  const http = await server(components);
  http.listen(5000, () => logger.info(`${config.appName} - Server ready and listening on port ${5000}`));
})();
