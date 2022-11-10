const { object, date, objectId, integer, arrayOf, string } = require("./json-schema/jsonSchemaTypes");

const collectionName = "duplicatesEvents";

const schema = object(
  {
    _id: objectId(),
    created_at: date(),
    jobType: string({ description: "Le type de job" }),
    args: object({ description: "L'action ayant eu lieu" }),
    commonData: object({ description: "Les données communes aux doublons" }),
    duplicatesCount: integer(),
    duplicatesIds: arrayOf(string()),
  },
  { strict: false }
);

module.exports = {
  schema,
  collectionName,
};
