import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "erp";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ nom: 1 }, { unique: true }]];

const zErp = z.object({
  _id: zObjectId,
  name: z.string(),
  created_at: z.date(),
  apiV3: z.boolean().nullish(),
  helpFilePath: z.string().nullish(),
  helpFileSize: z.string().nullish(),
});

export type IErp = z.output<typeof zErp>;
export default { zod: zErp, indexes, collectionName };
