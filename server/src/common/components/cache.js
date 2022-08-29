module.exports = (redisClient) => {
  return {
    get: (cacheKey) => {
      return redisClient.get(cacheKey);
    },
    set: async (cacheKey, value, options = {}) => {
      await redisClient.set(cacheKey, value);

      if (options.expiresIn) {
        await redisClient.expire(cacheKey, options.expiresIn);
      }
    },
    clear: () => {
      return redisClient.flushAll();
    },
  };
};
