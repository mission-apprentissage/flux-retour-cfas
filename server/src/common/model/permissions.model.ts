import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, objectIdOrNull, string, date, boolean } from "./json-schema/jsonSchemaTypes";

export const collectionName = "permissions";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ organisme_id: 1, userEmail: 1, role: 1 }, { unique: true }],
];

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
    role: objectId({ description: "Role id" }),
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

export default { schema, indexes, collectionName };