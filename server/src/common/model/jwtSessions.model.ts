import { object, string, objectId } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "jwtSessions";

function indexes() {
  return [[{ jwt: 1 }, { unique: true }]];
}

const schema = object(
  {
    _id: objectId(),
    jwt: string({ description: "Session token" }),
  },
  { required: ["jwt"], additionalProperties: false }
);

export default { schema, indexes, collectionName };
