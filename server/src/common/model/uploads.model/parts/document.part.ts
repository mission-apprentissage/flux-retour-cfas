import { object, string, integer, objectId, date, any, boolean } from "../../json-schema/jsonSchemaTypes.js";

export const documentSchema = object(
  {
    document_id: objectId({
      description: "Identifiant du document",
    }),
    mapping_column: any({
      description: "Mapping des colonnes du fichier",
      additionalProperties: true,
    }),
    type_document: string({
      description: "Le type de document (exemple: SIFA-2021, gabarit-tableau-de-bord)",
    }),
    ext_fichier: string({
      description: "Le type de fichier extension",
      enum: ["xlsx", "xls", "csv"], // 10mb
    }),
    nom_fichier: string({
      description: "Le nom de fichier",
    }),
    description_fichier: string({
      description: "Description de fichier",
    }),
    chemin_fichier: string({
      description: "Chemin du fichier binaire",
    }),
    taille_fichier: integer({
      description: "Taille du fichier en bytes",
    }),
    hash_fichier: string({
      description: "Checksum fichier",
    }),
    confirm: boolean({ description: "Le document est confirmé par l'utilisateur" }),
    added_by: string({
      description: "Qui a ajouté le fichier",
    }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  {
    required: [
      "document_id",
      "ext_fichier",
      "nom_fichier",
      "chemin_fichier",
      "taille_fichier",
      "hash_fichier",
      "added_by",
    ],
    additionalProperties: true,
  }
);
