import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, stringOrNull } from "./json-schema/jsonSchemaTypes";

const collectionName = "organismesSoltea";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ siret: 1 }, {}],
  [{ uai: 1 }, {}],
];

const schema = object(
  {
    _id: objectId(),
    uai: stringOrNull({ description: "Code UAI de l'établissement" }),
    siret: stringOrNull({ description: "N° SIRET de l'établissement" }),
    raison_sociale: stringOrNull(),
    commune: stringOrNull(),
    code_postal: stringOrNull(),
    departement: stringOrNull(),
  },
  { additionalProperties: true }
);

export default { schema, indexes, collectionName };