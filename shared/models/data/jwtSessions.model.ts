import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";

const collectionName = "jwtSessions";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ jwt: 1 }, { unique: true }]];

const zJwtSession = z.object({
  _id: z.any(),
  jwt: z.string({ description: "Session token" }),
});

export type IJwtSession = z.output<typeof zJwtSession>;

export default { zod: zJwtSession, indexes, collectionName };
