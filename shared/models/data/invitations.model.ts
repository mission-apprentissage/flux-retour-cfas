import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "invitations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ token: 1 }, { name: "token", unique: true }],
  [{ organisation_id: 1 }, { name: "organisation_id" }],
];

const zInvitation = z.object({
  _id: zObjectId,
  token: z.string({ description: "Jeton d'invitation" }),
  email: z.string({ description: "Email destinataire" }),
  organisation_id: zObjectId.describe("Organisation cible de l'invitation"),
  author_id: zObjectId.describe("Auteur de l'invitation"),
  role: z.enum(["admin", "member"]).optional().describe("Rôle attribué à l'utilisateur invité (CFA)"),
  prenom: z.string().optional().describe("Prénom de l'invité (si fourni à la création)"),
  nom: z.string().optional().describe("Nom de l'invité (si fourni à la création)"),
  created_at: z.date({ description: "Date de création en base de données" }),
  expires_at: z.date().optional().describe("Date d'expiration de l'invitation (96h après création)"),
});

export type IInvitation = z.output<typeof zInvitation>;

export default { zod: zInvitation, indexes, collectionName };
