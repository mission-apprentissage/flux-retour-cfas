import Joi from "joi";
import { object, objectId, objectIdOrNull, string, date, arrayOf, boolean } from "./json-schema/jsonSchemaTypes.js";
import { schemaValidation } from "../utils/schemaUtils.js";

export const collectionName = "permissions";

export function indexes() {
  return [[{ organisme_id: 1, userEmail: 1, role: 1 }, { unique: true }]];
}

// OF: 1_1 organisme_id userEmail
// Reseau: 1_* organisme_id userEmail
// Pilot avec territoire: 1_* organisme_id userEmail
// Pilot National: 1_* organisme_id=Null userEmail
// Admin: 1_* organisme_id=Null userEmail
// ERP: 1_* organisme_id userEmail
export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectIdOrNull({
      description: "Organisme id", // Could be null on purpose (to see all organismes)
    }),
    userEmail: string({ description: "Email utilisateur" }),
    role: objectId({ description: "Roles id" }),
    pending: boolean({ description: "En attente d'acceptation" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout de la permission" }),
  },
  { required: ["organisme_id", "userEmail", "role", "pending"], additionalProperties: false }
);

// Default value
export function defaultValuesPermission() {
  return {
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Extra validation
export function validatePermission(props) {
  return schemaValidation({
    entity: props,
    schema,
    extensions: [
      {
        name: "userEmail",
        base: Joi.string().email(),
      },
    ],
  });
}

export default { schema, indexes, collectionName };
