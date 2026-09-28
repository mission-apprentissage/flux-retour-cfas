import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";

const collectionName = "communesVoies";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ updated_at: 1 }, {}]];

const zCommunesVoies = z.object({
  _id: z.string().describe("Code postal partagé par plusieurs communes"),
  communes: z.array(
    z.object({
      code_insee: z.string(),
      nom: z.string(),
      population: z.number(),
    })
  ),
  voies: z.array(
    z.object({
      nom: z.string().describe("Nom de voie ou de lieu-dit normalisé"),
      code_insee: z.array(z.string()),
    })
  ),
  updated_at: z.date(),
});

export type ICommunesVoies = z.output<typeof zCommunesVoies>;

export default { zod: zCommunesVoies, indexes, collectionName };
