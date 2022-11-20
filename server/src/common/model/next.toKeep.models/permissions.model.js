import Joi from "joi";
import { object, objectId, objectIdOrNull, string, date, arrayOf, boolean } from "../json-schema/jsonSchemaTypes.js";
import { schemaValidation } from "../../utils/schemaUtils.js";

export const collectionName = "permissions";

export function indexes() {
  return [[{ organisme_id: 1, userEmail: 1, role: 1 }, { unique: true }]];
}

export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectIdOrNull({
      description: "Organisme id", // Could be null on purpose (indexes)
    }),
    userEmail: string({ description: "Email utilisateur" }),
    role: objectId({ description: "Roles id" }),
    custom_acl: arrayOf(string(), { description: "Custom access control level array" }),
    pending: boolean({ description: "En attente d'acceptation" }),
    created_at: date({ description: "Date d'ajout de la permission" }),
  },
  { required: ["userEmail", "role"], additionalProperties: false }
);

// Default value
export function defaultValuesPermission() {
  return {
    organisme_id: null,
    custom_acl: [],
    created_at: new Date(),
  };
}

// Extra validation
export function validatePermission(props) {
  return schemaValidation(props, schema, [
    {
      name: "userEmail",
      base: Joi.string().email(),
    },
  ]);
}
