import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "proconnectSessions";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ access_token: 1 }, { unique: true }],
  [{ email: 1 }, {}],
];

const zProconnectSession = z.object({
  _id: zObjectId,
  access_token: z.string({ description: "Session token" }),
  refresh_token: z.string({ description: "Refresh token" }),
  expires_at: z.date({ description: "Expiration date of the token" }),
  email: z.string({ description: "Email associated with the session" }),
  id_token: z.string({ description: "ID token" }),
});

export type IProconnectSession = z.output<typeof zProconnectSession>;

export default { zod: zProconnectSession, indexes, collectionName };
