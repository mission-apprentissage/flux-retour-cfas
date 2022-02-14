const nock = require("nock"); // eslint-disable-line node/no-unpublished-require
const { clearAllCollections, startAndConnectMongodb, stopMongodb } = require("./mongoUtils");
const { nockExternalApis } = require("./nockApis");
const redisFakeClient = require("./redisClientMock");
const { createIndexes } = require("../../src/common/indexes");

// disable HTTP requests on the network for tests, except to reach local server and mondodb-inmemory-server
nock.disableNetConnect();
nock.enableNetConnect((host) => {
  return host.startsWith("127.0.0.1") || host.includes("fastdl.mongodb.org");
});

// connect to mongodb and create indexes before running tests
exports.mochaGlobalSetup = async () => {
  const db = await startAndConnectMongodb();
  await createIndexes(db);
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
