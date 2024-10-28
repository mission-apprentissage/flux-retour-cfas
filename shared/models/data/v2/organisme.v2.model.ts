import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const collectionName = "organismeV2";

const zOrganismeV2 = z.object({
  _id: zObjectId,
  draft: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  uai: z.string().nullish(),
  siret: z.string().nullish(),
  current_organisme_id: zObjectId.nullish(),
});

export type IOrganismeV2 = z.output<typeof zOrganismeV2>;
export default { zod: zOrganismeV2, collectionName, indexes };
