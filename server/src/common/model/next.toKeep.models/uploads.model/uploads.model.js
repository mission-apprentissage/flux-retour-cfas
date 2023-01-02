import { object, objectId, array, date, arrayOf } from "../../json-schema/jsonSchemaTypes.js";
import { documentSchema } from "./parts/document.part.js";

export const collectionName = "uploads";

export function indexes() {
  return [[{ organisme_id: 1 }, { unique: true }]];
}

export const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({
      description: "Organisme id",
    }),
    documents: arrayOf(documentSchema, {
      description: "Historique des documents uploadé",
    }),
    last_snapshot_effectifs: array({ description: "Snapshot backup de tous les effectifs de l'organisme" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  {
    required: ["organisme_id"],
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesUpload() {
  return {
    documents: [],
    last_snapshot_effectifs: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}
