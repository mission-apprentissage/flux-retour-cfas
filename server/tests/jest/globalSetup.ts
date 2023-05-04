// import nock from "nock";

// import { createIndexes } from "@/common/model/indexes/index";

// import { startAndConnectMongodb } from "../utils/mongoUtils";

// const LOCAL_HOST = "127.0.0.1";
// const MONGODB_MEMORY_SERVER_DL_HOST = "fastdl.mongodb.org";

// // disable HTTP requests on the network for tests, except to reach local server and mondodb-inmemory-server
// nock.disableNetConnect();
// nock.enableNetConnect((host) => {
//   return host.includes(LOCAL_HOST) || host.includes(MONGODB_MEMORY_SERVER_DL_HOST);
// });

// connect to mongodb and create indexes before running tests
export default async function globalSetup() {
  // await startAndConnectMongodb();
  // await createIndexes();
}
