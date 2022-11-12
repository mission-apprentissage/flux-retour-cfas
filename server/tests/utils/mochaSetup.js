import nock from 'nock'; // eslint-disable-line node/no-unpublished-require
import { clearAllCollections, startAndConnectMongodb, stopMongodb } from './mongoUtils';
import { nockExternalApis } from './nockApis';
import redisFakeClient from './redisClientMock';
import { createIndexes } from '../../src/common/model/indexes/index';

const LOCAL_HOST = "127.0.0.1";
const MONGODB_MEMORY_SERVER_DL_HOST = "fastdl.mongodb.org";

// disable HTTP requests on the network for tests, except to reach local server and mondodb-inmemory-server
nock.disableNetConnect();
nock.enableNetConnect((host) => {
  return host.includes(LOCAL_HOST) || host.includes(MONGODB_MEMORY_SERVER_DL_HOST);
});

// connect to mongodb and create indexes before running tests
export const mochaGlobalSetup = async () => {
  await startAndConnectMongodb();
  await createIndexes();
};

// hooks that will be used in every test suite
export const mochaHooks = {
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
export const mochaGlobalTeardown = async () => {
  await stopMongodb();
};
