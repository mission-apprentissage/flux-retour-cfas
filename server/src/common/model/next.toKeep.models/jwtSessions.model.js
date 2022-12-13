import { object, string, objectId } from "../json-schema/jsonSchemaTypes.js";

export const collectionName = "jwtSessions";

export function indexes() {
  return [[{ jwt: 1 }, { unique: true }]];
}

export const schema = object(
  {
    _id: objectId(),
    jwt: string({ description: "Session token" }),
  },
  { required: ["jwt"], additionalProperties: false }
);
