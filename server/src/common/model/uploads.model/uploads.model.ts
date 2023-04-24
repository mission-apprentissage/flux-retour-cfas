import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { preDefinedModels } from "@/common/constants/models/upload.models.part";
import {
  object,
  objectId,
  array,
  date,
  arrayOf,
  any,
  string,
  boolean,
} from "@/common/model/json-schema/jsonSchemaTypes";

import { documentSchema } from "./parts/document.part";

const collectionName = "uploads";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ organisme_id: 1 }, { unique: true }]];

/**
 * cet objet représente le schéma de données d'un upload pour un organisme donné.
 * chaque fichier uploadé est ajouté au tableau 'documents'.
 * chaque mapping est ajouté au tableau 'models'.
 */
const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({
      description: "Organisme id",
    }),
    documents: arrayOf(documentSchema, {
      description: "Historique des documents uploadés",
    }),

    models: arrayOf(
      object({
        type_document: string({
          description: "Le type de document (exemple: SIFA-2021, gabarit-tableau-de-bord)",
        }),
        mapping_column: any({
          description: "Mapping des colonnes du fichier",
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
