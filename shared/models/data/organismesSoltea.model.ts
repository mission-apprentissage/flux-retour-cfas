import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "organismesSoltea";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ siret: 1 }, {}],
  [{ uai: 1 }, {}],
];

const zOrganismeSoltea = z.object({
  _id: zObjectId,
  uai: z.string().nullish().describe("Code UAI de l'établissement"),
  siret: z.string().nullish().describe("N° SIRET de l'établissement"),
  raison_sociale: z.string().nullish(),
  commune: z.string().nullish(),
  code_postal: z.string().nullish(),
  departement: z.string().nullish(),
  ligne1_adresse: z.string().optional(),
  ligne2_adresse: z.string().optional(),
  ligne3_adresse: z.string().optional(),
  ligne4_adresse: z.string().optional(),
  ligne5_adresse: z.string().optional(),
});

export type IOrganismeSoltea = z.output<typeof zOrganismeSoltea>;

export default { zod: zOrganismeSoltea, indexes, collectionName };
