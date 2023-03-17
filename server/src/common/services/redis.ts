import redis from "redis";
import logger from "../logger.js";

export const createRedis = async ({ uri, onReady, onError }) => {
  logger.info("Connecting to redis...");
  const redisClient = redis.createClient({
    url: uri,
  });

  redisClient.on("ready", onReady);
  redisClient.on("error", onError);

  await redisClient.connect();

  return redisClient;
};
