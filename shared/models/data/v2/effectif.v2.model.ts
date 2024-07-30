import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const collectionName = "effectifV2";

export const zEffectifV2Computed = z
  .object({
    nom: z.string().nullish(),
    prenom: z.string().nullish(),
    date_de_naissance: z.date().nullish(),
  })
  .nullish();
export const zEffectifV2 = z.object({
  _id: zObjectId,
  created_at: z.date(),
  updated_at: z.date(),
  draft: z.boolean(),
  formation_id: zObjectId,
  person_id: zObjectId,
  _computed: zEffectifV2Computed,
});

export type IEffectifV2 = z.output<typeof zEffectifV2>;
export default { zod: zEffectifV2, collectionName, indexes };
