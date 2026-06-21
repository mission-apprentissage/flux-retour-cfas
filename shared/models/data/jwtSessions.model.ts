import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "jwtSessions";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ jwt: 1 }, { unique: true }],
  [{ created_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 10, name: "ttl_created_at" }],
];

const zJwtSession = z.object({
  _id: zObjectId,
  jwt: z.string({ description: "Session token" }),
  created_at: z.date({ description: "Date de création de la session (support du TTL)" }),
});

export type IJwtSession = z.output<typeof zJwtSession>;

export default { zod: zJwtSession, indexes, collectionName };
