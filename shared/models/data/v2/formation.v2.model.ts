import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const collectionName = "formationV2";

const zFormationV2 = z.object({
  _id: zObjectId,
});

export type IFormationV2 = z.output<typeof zFormationV2>;
export default { zod: zFormationV2, collectionName, indexes };
