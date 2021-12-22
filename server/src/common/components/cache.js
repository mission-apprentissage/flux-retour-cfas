module.exports = (redisClient) => {
  return {
    get: (cacheKey) => {
      return redisClient.get(cacheKey);
    },
    set: (cacheKey, value) => {
      return redisClient.set(cacheKey, value);
    },
    clear: () => {
      return redisClient.flushAll();
    },
  };
};
