const { object, string, date, objectId } = require("./json-schema/jsonSchemaTypes");

const collectionName = "demandesIdentifiants";

const schema = object({
  _id: objectId(),
  profil: string(),
  region: string(),
  email: string(),
  created_at: date(),
});

module.exports = {
  schema,
  collectionName,
};
