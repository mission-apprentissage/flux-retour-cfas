import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "invitationsArchive";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const zInvitationArchive = z.object({
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

export type IInvitationArchive = z.output<typeof zInvitationArchive>;

export default { zod: zInvitationArchive, indexes, collectionName };
