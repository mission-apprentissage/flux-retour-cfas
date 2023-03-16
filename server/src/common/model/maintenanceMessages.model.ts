import { object, objectId, string, date, boolean } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "maintenanceMessages";

function indexes() {
  return [];
}

const schema = object(
  {
    _id: objectId(),
    msg: string({ description: "Message de maintenance" }),
    name: string({ description: "email du créateur du message" }),
    type: string({ enum: ["alert", "info"] }),
    context: string({ enum: ["manuel", "automatique", "maintenance"] }),
    time: date({ description: "Date de mise en place du message" }),
    enabled: boolean({ description: "Message actif ou non" }),
  },
  { required: ["msg", "type", "context", "name"], additionalProperties: false }
);

// Default value
export function defaultValuesMaintenanceMessage() {
  return {
    time: new Date(),
  };
}

export default { schema, indexes, collectionName };
