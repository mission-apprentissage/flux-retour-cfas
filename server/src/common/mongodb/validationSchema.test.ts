import { zodToMongoSchema } from "shared";
import { it, expect, describe } from "vitest";

import { modelDescriptors } from "@/common/model/collections";

describe("validation-schema", () => {
  modelDescriptors.forEach(async (descriptor) => {
    it(`should create validation schema for ${descriptor.collectionName}`, () => {
      expect(zodToMongoSchema(descriptor.zod)).toMatchSnapshot(descriptor.collectionName);
    });
  });
});
