import { object, date, objectId, integer, arrayOf, string } from "./json-schema/jsonSchemaTypes.js";

export const collectionName = "duplicatesEvents";

const schema = object({
  _id: objectId(),
  created_at: date(),
  jobType: string({ description: "Le type de job" }),
  args: object({}, { additionalProperties: true, description: "L'action ayant eu lieu" }),
  commonData: object({}, { additionalProperties: true, description: "Les données communes aux doublons" }),
  duplicatesCount: integer(),
  duplicatesIds: arrayOf(string()),
});

export default { schema, collectionName };
