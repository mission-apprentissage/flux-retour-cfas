const { object, objectId } = require("./json-schema/jsonSchemaTypes");

const collectionName = "archiveDossiersApprenants";

const schema = object({
  _id: objectId(),
  data: object({}, { additionalProperties: true }),
});

module.exports = {
  collectionName,
  schema,
};
