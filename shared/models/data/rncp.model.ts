import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "rncp";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ rncp: 1 }, { unique: true }],
  [{ opcos: 1 }, {}],
];

const zRncp = z.object({
  _id: zObjectId,
  rncp: z.string(),
  nouveaux_rncp: z.array(z.string()).optional(),
  intitule: z.string(),
  niveau: z.number().optional(),
  etat_fiche: z.string(),
  actif: z.boolean(),
  romes: z.array(z.string()),
  opcos: z
    .array(z.string(), { description: "Information récupérée depuis les CSV des OPCOs et non le RNCP" })
    .optional(),
});

export type IRncp = z.output<typeof zRncp>;

export default { zod: zRncp, indexes, collectionName };
