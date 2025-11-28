import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ code: 1 }, { name: "code_index" }]];

const collectionName = "regions";

const zRegion = z.object({
  _id: zObjectId,
  nom: z.string(),
  code: z.string(),
});

export type IRegion = z.output<typeof zRegion>;
export default { zod: zRegion, collectionName, indexes };
