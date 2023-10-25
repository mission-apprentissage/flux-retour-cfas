import { object, string, date, objectId } from "./json-schema/jsonSchemaTypes";

const collectionName = "auditLogs";

const schema = object(
  {
    _id: objectId(),
    action: string({ description: "L'action en cours" }),
    date: date({ description: "La date de l'evenement" }),
    data: object({}, { additionalProperties: true, description: "La donnée liéé à l'action" }),
  },
  { required: ["action", "date"] }
);

export default { schema, collectionName, indexes: [] };
