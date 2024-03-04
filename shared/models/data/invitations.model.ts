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
  created_at: z.date({ description: "Date de création en base de données" }),
});

export type IInvitation = z.output<typeof zInvitation>;

export default { zod: zInvitation, indexes, collectionName };
