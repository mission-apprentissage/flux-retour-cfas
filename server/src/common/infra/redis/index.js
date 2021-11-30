const redis = require("redis");

const initRedis = async ({ uri, onReady, onError }) => {
  const redisClient = redis.createClient({
    url: uri,
  });

  redisClient.on("ready", onReady);
  redisClient.on("error", onError);

  await redisClient.connect();

  return redisClient;
};

module.exports = { initRedis };
