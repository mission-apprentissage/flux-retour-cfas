import { object, date, objectId, integer, arrayOf, string } from "./json-schema/jsonSchemaTypes";

export const collectionName = "duplicatesEvents";

export const schema = object(
  {
    _id: objectId(),
    created_at: date(),
    jobType: string({ description: "Le type de job" }),
    args: object({ description: "L'action ayant eu lieu" }),
    commonData: object({ description: "Les données communes aux doublons" }),
    duplicatesCount: integer(),
    duplicatesIds: arrayOf(string()),
  },
  { strict: false }
);
