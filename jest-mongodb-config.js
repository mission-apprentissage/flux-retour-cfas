module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: "6.0.1",
    },
    autoStart: false,
    instance: {},
  },
  useSharedDBForAllJestWorkers: false,
};
