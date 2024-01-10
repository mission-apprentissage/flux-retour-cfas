import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { object, string, objectId } from "shared";

const collectionName = "jwtSessions";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ jwt: 1 }, { unique: true }]];

const schema = object(
  {
    _id: objectId(),
    jwt: string({ description: "Session token" }),
  },
  { required: ["jwt"], additionalProperties: false }
);

export default { schema, indexes, collectionName };
