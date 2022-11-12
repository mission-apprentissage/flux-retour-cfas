const inMemoryRedis = {};

const set = async (key, value) => {
  inMemoryRedis[key] = value;
};

const get = async (key) => {
  return inMemoryRedis[key];
};

const flushall = async () => {
  Object.keys(inMemoryRedis).forEach((key) => {
    delete inMemoryRedis[key];
  });
};

export default {
  set,
  get,
  flushall,
};
