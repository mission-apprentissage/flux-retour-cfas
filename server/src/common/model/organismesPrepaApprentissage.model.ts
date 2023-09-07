import { object, objectId, stringOrNull } from "./json-schema/jsonSchemaTypes";

const collectionName = "organismesPrepaApprentissage";

const schema = object(
  {
    _id: objectId(),
    uai: stringOrNull({ description: "Code UAI de l'établissement" }),
    siret: stringOrNull({ description: "N° SIRET de l'établissement" }),
    raison_sociale: stringOrNull(),
    enseigne: stringOrNull(),
    nature: stringOrNull(),
    departement: stringOrNull(),
    commune: stringOrNull(),
    code_postal: stringOrNull(),
    adresse: stringOrNull(),
    prepa_apprentissage: stringOrNull(),
  },
  { additionalProperties: true }
);

export default { schema, collectionName };
