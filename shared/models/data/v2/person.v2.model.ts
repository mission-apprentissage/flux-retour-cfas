import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const collectionName = "personV2";

export const zPersonV2 = z.object({
  _id: zObjectId,
  created_at: z.date(),
  updated_at: z.date(),
  nom: z.string(),
  prenom: z.string(),
  date_de_naissance: z.union([z.date(), z.string()]).nullish(),
  // Todo: add more fields for apprenant
  // Todo: add arrays of change ?
});

export type IPersonV2 = z.output<typeof zPersonV2>;
export default { zod: zPersonV2, collectionName, indexes };
