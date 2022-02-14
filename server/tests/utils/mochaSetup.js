const nock = require("nock"); // eslint-disable-line node/no-unpublished-require
const { connectToMongo, closeMongoConnection } = require("../../src/common/mongodb");
const { clearAllCollections } = require("./mongoUtils");
const redisFakeClient = require("./redisClientMock");

// disable HTTP requests on the network for tests, except to reach local server
nock.disableNetConnect();
nock.enableNetConnect((host) => {
  return host.startsWith("127.0.0.1");
});

// connect to mongodb before running tests
exports.mochaGlobalSetup = async () => {
  await connectToMongo();
};

// hooks that will be used in every test suite
exports.mochaHooks = {
  afterEach: async () => {
    nock.cleanAll();
    await clearAllCollections();
    await redisFakeClient.flushall();
  },
};

// close mongo connection when all tests have been run
exports.mochaGlobalTeardown = async () => {
  await closeMongoConnection();
};
