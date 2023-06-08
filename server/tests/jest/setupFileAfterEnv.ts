import nock from "nock";

import { modelDescriptors } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { clearAllCollections, configureDbSchemaValidation } from "@/common/mongodb";
import { stopMongodb, startAndConnectMongodb } from "@tests/utils/mongoUtils";

import { nockExternalApis } from "../utils/nockApis/index";

const LOCAL_HOST = "127.0.0.1";
const MONGODB_MEMORY_SERVER_DL_HOST = "fastdl.mongodb.org";

// Mock mailer service (a bit hacky to implement since jest has been configured for ES modules)
// https://jestjs.io/docs/ecmascript-modules
(import.meta.jest as any).unstable_mockModule("@/common/services/mailer/mailer", () => ({
  createMailerService: import.meta.jest.fn(),
  getEmailInfos: import.meta.jest.fn(),
  sendEmail: import.meta.jest.fn(),
}));

// eslint-disable-next-line node/no-unsupported-features/es-syntax
await import("@/common/services/mailer/mailer");

beforeAll(async () => {
  // disable HTTP requests on the network for tests, except to reach local server and mondodb-inmemory-server
  nock.disableNetConnect();
  nock.enableNetConnect((host) => {
    return host.includes(LOCAL_HOST) || host.includes(MONGODB_MEMORY_SERVER_DL_HOST);
  });

  // connect to mongodb and create indexes before running tests
  await startAndConnectMongodb();
  await createIndexes();
}, 10_000);

afterAll(async () => {
  await stopMongodb();
});

beforeEach(async () => {
  nockExternalApis();
  await Promise.all([clearAllCollections(), configureDbSchemaValidation(modelDescriptors)]);
});

afterEach(async () => {
  nock.cleanAll();
});
