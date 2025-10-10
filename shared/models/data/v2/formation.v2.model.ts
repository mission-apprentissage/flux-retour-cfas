import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    {
      "identifiant.cfd": 1,
      "identifiant.rncp": 1,
      "identifiant.responsable_siret": 1,
      "identifiant.responsable_uai": 1,
      "identifiant.formateur_siret": 1,
      "identifiant.formateur_uai": 1,
    },
    { unique: true },
  ],
];

const collectionName = "formationV2";

export const zFormationV2 = z.object({
  _id: zObjectId,
  identifiant: z.object({
    cfd: z.string().nullable(),
    rncp: z.string().nullable(),
    responsable_siret: z.string().nullable(),
    responsable_uai: z.string().nullable(),
    formateur_siret: z.string().nullable(),
    formateur_uai: z.string().nullable(),
  }),
  organisme_formateur_id: zObjectId.nullish(),
  organisme_responsable_id: zObjectId.nullish(),
  draft: z.boolean(),
});

export type IFormationV2 = z.output<typeof zFormationV2>;
export default { zod: zFormationV2, collectionName, indexes };
