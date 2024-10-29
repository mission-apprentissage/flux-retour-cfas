import nock from "nock";
import { beforeAll, beforeEach, afterEach } from "vitest";

import { nockExternalApis } from "../utils/nockApis/index";

const LOCAL_HOST = "127.0.0.1";
const MONGODB_MEMORY_SERVER_DL_HOST = "fastdl.mongodb.org";

export const useNock = () => {
  beforeAll(() => {
    // disable HTTP requests on the network for tests, except to reach local server and mondodb-inmemory-server
    nock.disableNetConnect();
    nock.enableNetConnect((host) => {
      return host.includes(LOCAL_HOST) || host.includes(MONGODB_MEMORY_SERVER_DL_HOST);
    });
  });
  beforeEach(() => {
    nockExternalApis();
  });
  afterEach(() => {
    nock.cleanAll();
  });
};
