import { date, object, objectId } from "../../json-schema/jsonSchemaTypes.js";

const collectionName = "archiveDossiersApprenants";

const schema = object({
  _id: objectId(),
  data: object({}, { additionalProperties: true }),
  created_at: date(),
});

export default {
  collectionName,
  schema,
};
