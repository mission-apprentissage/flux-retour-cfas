import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const collectionName = "personV2";

const zPersonV2 = z.object({
  _id: zObjectId,
});

export type IPersonV2 = z.output<typeof zPersonV2>;
export default { zod: zPersonV2, collectionName, indexes };
