import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ "identifiant.nom": 1, "identifiant.prenom": 1, "identifiant.date_de_naissance": 1 }, { unique: true }],
];

const collectionName = "personV2";

const zPersonV2 = z.object({
  _id: zObjectId,
  identifiant: z.object({
    nom: z.string(),
    prenom: z.string(),
    date_de_naissance: z.date(),
  }),
  parcours: z.object({
    en_cours: z.object({
      eV2_id: zObjectId,
      date_inscription: z.date(),
    }).nullable(),
    chronologie: z.array(
      z.object({
        eV2_id: zObjectId,
        date_inscription: z.date(),
      })
    ),
  }),
});

export type IPersonV2 = z.output<typeof zPersonV2>;
export default { zod: zPersonV2, collectionName, indexes };
