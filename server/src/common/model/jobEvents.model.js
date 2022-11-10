const { object, string, date, objectId } = require("./json-schema/jsonSchemaTypes");

const collectionName = "jobEvents";

const schema = object(
  {
    _id: objectId(),
    jobname: string({ description: "Le nom du job" }),
    date: date({ description: "La date de l'evenement" }),
    action: string({ description: "L'action en cours" }),
    data: object({ description: "La donnée liéé à l'action" }),
  },
  { required: ["jobname", "action"] }
);

module.exports = {
  schema,
  collectionName,
};
