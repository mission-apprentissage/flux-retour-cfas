import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "users";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ username: 1 }, { name: "username" }],
  [{ email: 1 }, { name: "email" }],
  [{ organisme: 1 }, { name: "organisme" }],
];

const zUser = z.object({
  _id: zObjectId,
  username: z.string().describe("Le nom de l'utilisateur, utilisé pour l'authentification"),
  email: z.string().nullish().describe("Email de l'utilisateur"),
  password: z.string().optional().describe("Le mot de passe hashed"),
  password_update_token: z.string().nullish().describe("Token généré afin de sécuriser le changement de mot de passe"),
  password_update_token_expiry: z
    .date()
    .nullish()
    .describe("Date d'expiration du token généré afin de sécuriser le changement de mot de passe"),
  permissions: z.array(z.string()).optional(),
  last_connection: z.date().optional().describe("Date de dernière connexion"),
  network: z.string().nullish().describe("Le réseau de CFA de l'utilisateur s'il est précisé"),
  region: z.string().nullish().describe("La région de l'utilisateur s'il est précisé"),
  organisme: z.string().nullish().describe("L'organisme d'appartenance de l'utilisateur s'il est précisé"),
  created_at: z.date().describe("La date de création de l'utilisateur"),
  __v: z.number().optional(),
  archived_at: z.date().optional(),
});

export type IUser = z.output<typeof zUser>;

export default { zod: zUser, indexes, collectionName };
