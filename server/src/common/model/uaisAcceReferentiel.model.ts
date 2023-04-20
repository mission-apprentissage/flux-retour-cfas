import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, string } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "uaisAcceReferentiel";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ uai: 1 }, {}]];

const schema = object({
  _id: objectId(),
  uai: string(),
});

export default { schema, indexes, collectionName };
