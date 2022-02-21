const server = require("./http/server");
const logger = require("./common/logger");
const config = require("../config");
const { initRedis } = require("./common/infra/redis");
const createComponents = require("./common/components/components");
const { connectToMongo } = require("./common/mongodb");

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  // redis
  const redisClient = await initRedis({
    uri: config.redis.uri,
    onError: (err) => logger.error("Redis client error", err),
    onReady: () => logger.info("Redis client ready!"),
  });

  const mongodbClient = await connectToMongo();

  const components = await createComponents({ db: mongodbClient.db, redisClient });

  const http = await server(components);
  http.listen(5000, () => logger.info(`${config.appName} - Server ready and listening on port ${5000}`));
})();
