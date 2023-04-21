import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, string } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "uaisAcceReferentiel";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ uai: 1 }, { unique: true }]];

const schema = object({ _id: objectId(), uai: string() }, { required: ["uai"] });

export default { schema, indexes, collectionName };
