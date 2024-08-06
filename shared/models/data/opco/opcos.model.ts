import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "opcos";

export enum OpcoName {
  AFDAS = "afdas",
  ATLAS = "atlas",
  UNIFORMATION = "uniformation",
  AKTO = "akto",
  OCAPIAT = "ocapiat",
  DEUX_I = "2i",
  CONSTRUCTYS = "constructys",
  MOBILITES = "mobilites",
  EP = "ep",
  SANTE = "sante",
  OPCOMMERCE = "opcommerce",
}
const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const zOpco = z.object({
  _id: zObjectId,
  name: z.string(),
});

export type IOpcos = z.output<typeof zOpco>;

export default { zod: zOpco, indexes, collectionName };
