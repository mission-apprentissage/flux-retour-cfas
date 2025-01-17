import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "reseaux";

export const zReseau = z.object({
  _id: zObjectId.optional(),
  key: z
    .string({
      description: "Clé du réseau",
    })
    .min(1, "La clé du réseau est obligatoire"),
  nom: z
    .string({
      description: "Nom du réseau",
    })
    .min(1, "Le nom du réseau est obligatoire"),
  responsable: z
    .boolean({
      description: "Le réseau est-il responsable ?",
    })
    .default(false),
  organismes_ids: z
    .array(zObjectId, {
      description: "Liste des IDs des organismes associés au réseau",
    })
    .default([]),
  created_at: z
    .date({
      description: "Date de création du réseau",
    })
    .default(() => new Date()),
  updated_at: z
    .date({
      description: "Date de dernière mise à jour du réseau",
    })
    .default(() => new Date()),
});

export type IReseau = z.infer<typeof zReseau>;

export const reseauxIndexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ key: 1 }, { name: "key", unique: true }],
  [{ nom: 1 }, { name: "nom", unique: true }],
  [{ organismes_ids: 1 }, { name: "organismes_ids" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ updated_at: 1 }, { name: "updated_at" }],
];

export default { zod: zReseau, indexes: reseauxIndexes, collectionName };
