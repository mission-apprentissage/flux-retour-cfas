import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "opcoRncp";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const zOpcoRncpComputed = z.object({
  opco: z.object({
    nom: z.string(),
  }),
  rncp: z.object({
    code: z.string(),
  }),
});

const zOpcoRncp = z.object({
  _id: zObjectId,
  opco_id: zObjectId,
  rncp_id: zObjectId,
  _computed: zOpcoRncpComputed,
});

export type IOpcoRncp = z.output<typeof zOpcoRncp>;

export default { zod: zOpcoRncp, indexes, collectionName };
