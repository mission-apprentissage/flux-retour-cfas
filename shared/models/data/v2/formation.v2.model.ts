import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    {
      cfd: 1,
      rncp: 1,
      organisme_formateur_id: 1,
      organisme_responsable_id: 1,
    },
    {},
  ],
];

const collectionName = "formationV2";

const zFormationV2 = z.object({
  _id: zObjectId,
  draft: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  organisme_responsable_id: zObjectId,
  organisme_formateur_id: zObjectId,
  rncp: z.string().nullish(),
  cfd: z.string().nullish(),
});

export type IFormationV2 = z.output<typeof zFormationV2>;
export default { zod: zFormationV2, collectionName, indexes };
