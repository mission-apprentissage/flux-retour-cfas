import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "connexionInvitations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ token: 1 }, { name: "token", unique: true }],
  [{ email: 1 }, { name: "email", unique: true }],
];

const zConnexionInvitation = z.object({
  _id: zObjectId,
  token: z.string({ description: "Jeton aléatoire (hex)" }),
  email: z.string({ description: "Email du destinataire" }),
  source: z.string({ description: "Origine de la génération (ex. 'tba-contacts')" }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type IConnexionInvitation = z.output<typeof zConnexionInvitation>;

export default { zod: zConnexionInvitation, indexes, collectionName };
