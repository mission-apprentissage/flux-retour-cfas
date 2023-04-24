import nock from "nock";

import { modelDescriptors } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes/index";
import { clearAllCollections, configureDbSchemaValidation } from "@/common/mongodb";

import { startAndConnectMongodb, stopMongodb } from "./mongoUtils";
import { nockExternalApis } from "./nockApis/index";

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
  beforeEach: async () => {
    nockExternalApis();
    await Promise.all([clearAllCollections(), configureDbSchemaValidation(modelDescriptors)]);
  },
  afterEach: async () => {
    nock.cleanAll();
  },
};

// close mongo connection when all tests have been run
export const mochaGlobalTeardown = async () => {
  await stopMongodb();
};
