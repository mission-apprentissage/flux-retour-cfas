import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId } from "./json-schema/jsonSchemaTypes";

const collectionName = "formationsCatalogue";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const schema = object(
  {
    _id: objectId(),
  },
  {
    additionalProperties: true,
  }
);

export default { schema, indexes, collectionName };
