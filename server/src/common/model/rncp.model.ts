import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { arrayOf, object, objectId, string } from "./json-schema/jsonSchemaTypes";

const collectionName = "rncp";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ rncp: 1 }, { unique: true }]];

const schema = object(
  {
    _id: objectId(),
    rncp: string(),
    romes: arrayOf(string()),
  },
  { required: ["rncp", "romes"], additionalProperties: false }
);

export default { schema, indexes, collectionName };
