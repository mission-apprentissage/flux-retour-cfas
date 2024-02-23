import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "jwtSessions";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ jwt: 1 }, { unique: true }]];

const zJwtSession = z.object({
  _id: zObjectId,
  jwt: z.string({ description: "Session token" }),
});

export type IJwtSession = z.output<typeof zJwtSession>;

export default { zod: zJwtSession, indexes, collectionName };
