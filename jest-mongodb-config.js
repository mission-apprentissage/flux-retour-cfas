module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: "6.0.2",
    },
    autoStart: false,
    instance: {},
  },
  useSharedDBForAllJestWorkers: false,
};
