import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "romeSecteurActivites";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ code_secteur: 1 }, { unique: true }],
  [{ "romes.code_rome": 1 }, {}],
];

const zRomeSecteurActivites = z.object({
  _id: zObjectId,
  code_secteur: z.number(),
  libelle_secteur: z.string(),
  romes: z.array(
    z.object({
      code_rome: z.string(),
      code_ogr_rome: z.number(),
      libelle_rome: z.string(),
    })
  ),
});

export type IRomeSecteurActivites = z.output<typeof zRomeSecteurActivites>;

export default { zod: zRomeSecteurActivites, indexes, collectionName };
