import { zodToMongoSchema } from "zod-mongodb-schema";

import { modelDescriptors } from "@/common/model/collections";

describe("validation-schema", () => {
  modelDescriptors.forEach(async (descriptor) => {
    it(`should create validation schema for ${descriptor.collectionName}`, () => {
      const convertedSchema = "zod" in descriptor ? zodToMongoSchema(descriptor.zod) : descriptor.schema;
      expect(convertedSchema).toMatchSnapshot(descriptor.collectionName);
    });
  });
});
