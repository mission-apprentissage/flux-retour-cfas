import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "sipaUsers";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ username: 1 }, { unique: true }]];

export const zSipaUser = z.object({
  _id: zObjectId,
  username: z
    .string()
    .regex(/^[A-Za-z0-9._-]+$/)
    .describe("Identifiant du compte technique SIPA (alphanumérique + . - _)"),
  password: z.string().describe("Le mot de passe hashé (sha512crypt)"),
  created_at: z.date().describe("Date de création du compte"),
  last_connection: z.date().optional().describe("Date du dernier login réussi"),
});

export type ISipaUser = z.output<typeof zSipaUser>;

export default { zod: zSipaUser, indexes, collectionName };
