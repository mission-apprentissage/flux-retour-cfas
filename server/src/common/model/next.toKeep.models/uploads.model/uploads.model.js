import { preDefinedModels } from "../../../constants/models/upload.models.part.js";
import { object, objectId, array, date, arrayOf, any, string, boolean } from "../../json-schema/jsonSchemaTypes.js";
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

    models: arrayOf(
      object({
        type_document: string({
          description: "Le type de document (exemple: SIFA-2021, gabarit-tableau-de-bord)",
        }),
        mapping_column: any({
          description: "Mapping des colonnes du fichier",
          additionalProperties: true,
        }),
        lock: boolean({ description: "Le modèle est vérouillé" }),
      }),
      {
        description: "Erreurs de validation de cet effectif",
      }
    ),

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
    models: preDefinedModels,
    last_snapshot_effectifs: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

export default { schema, indexes, collectionName };
