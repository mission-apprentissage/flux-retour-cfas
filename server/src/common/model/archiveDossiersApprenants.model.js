import { object, objectId } from "./json-schema/jsonSchemaTypes.js";

const collectionName = "archiveDossiersApprenants";

const schema = object({
  _id: objectId(),
  data: object({}, { additionalProperties: true }),
});

export default {
  collectionName,
  schema,
};
