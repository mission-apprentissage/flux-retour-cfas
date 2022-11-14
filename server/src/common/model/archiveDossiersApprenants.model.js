const { object, objectId } = require("./json-schema/jsonSchemaTypes");

const collectionName = "archiveDossiersApprenants";

const schema = object({
  _id: objectId(),
  data: object(),
});

module.exports = {
  collectionName,
  schema,
};
