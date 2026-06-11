import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "sipaUsers";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ username: 1 }, { unique: true }]];

export const zSipaUsername = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._-]+$/)
  .describe("Identifiant du compte technique SIPA (alphanumérique + . - _, max 64 caractères)");

export const SIPA_PASSWORD_MIN_LENGTH = 20;
export const SIPA_PASSWORD_MAX_LENGTH = 128;

export const zSipaUser = z.object({
  _id: zObjectId,
  username: zSipaUsername,
  password: z.string().describe("Le mot de passe hashé (sha512crypt)"),
  created_at: z.date().describe("Date de création du compte"),
  last_connection: z.date().optional().describe("Date du dernier login réussi"),
});

export type ISipaUser = z.output<typeof zSipaUser>;

export default { zod: zSipaUser, indexes, collectionName };
