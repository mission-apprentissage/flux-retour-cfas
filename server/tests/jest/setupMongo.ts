import { modelDescriptors } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { clearAllCollections, configureDbSchemaValidation } from "@/common/mongodb";
import { startAndConnectMongodb, stopMongodb } from "@tests/utils/mongoUtils";

export const useMongo = () => {
  beforeAll(async () => {
    // connect to mongodb and create indexes before running tests
    await startAndConnectMongodb();
    await createIndexes();
  }, 30_000);
  afterAll(async () => {
    await stopMongodb();
  });
  beforeEach(async () => {
    await Promise.all([clearAllCollections(), configureDbSchemaValidation(modelDescriptors)]);
  });
};
