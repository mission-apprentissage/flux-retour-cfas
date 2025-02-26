import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "organismesMailReferentiel";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ email: 1 }, { unique: true }]];

export const zOrganismesMailReferentielStatut = z.enum(["not_supported", "invalid", "error", "valid"]);

export const zOrganismesMailReferentiel = z.object({
  _id: zObjectId,
  email: z.string(),
  statut: zOrganismesMailReferentielStatut,
});

export type IOrganismesMailReferentiel = z.output<typeof zOrganismesMailReferentiel>;
export type IOrganismesMailReferentielStatut = z.output<typeof zOrganismesMailReferentielStatut>;
export default { zod: zOrganismesMailReferentiel, indexes, collectionName };
