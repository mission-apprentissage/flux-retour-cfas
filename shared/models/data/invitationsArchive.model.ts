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
  created_at: z.date({ description: "Date de création en base de données" }),
});

export type IInvitationArchive = z.output<typeof zInvitationArchive>;

export default { zod: zInvitationArchive, indexes, collectionName };
