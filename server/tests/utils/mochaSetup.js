const nock = require("nock"); // eslint-disable-line node/no-unpublished-require
const { clearAllCollections, startAndConnectMongodb, stopMongodb } = require("./mongoUtils");
const { nockExternalApis } = require("./nockApis");
const redisFakeClient = require("./redisClientMock");
const { createIndexes } = require("../../src/common/indexes");

const LOCAL_HOST = "127.0.0.1";
const MONGODB_MEMORY_SERVER_DL_HOST = "fastdl.mongodb.org";

// disable HTTP requests on the network for tests, except to reach local server and mondodb-inmemory-server
nock.disableNetConnect();
nock.enableNetConnect((host) => {
  return host.includes(LOCAL_HOST) || host.includes(MONGODB_MEMORY_SERVER_DL_HOST);
});

// connect to mongodb and create indexes before running tests
exports.mochaGlobalSetup = async () => {
  await startAndConnectMongodb();
  await createIndexes();
};

// hooks that will be used in every test suite
exports.mochaHooks = {
  beforeEach: () => {
    nockExternalApis();
  },
  afterEach: async () => {
    nock.cleanAll();
    await clearAllCollections();
    await redisFakeClient.flushall();
  },
};

// close mongo connection when all tests have been run
exports.mochaGlobalTeardown = async () => {
  await stopMongodb();
};
