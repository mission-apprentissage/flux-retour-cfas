const { object, objectId, string, date } = require("./json-schema/jsonSchemaTypes");

const collectionName = "userEvents";

const schema = () => {
  return object(
    {
      _id: objectId(),
      username: string({ description: "Le nom de l'utilisateur, utilisé pour l'authentification" }),
      user_organisme: string({ description: "L'organisme de l'utilisateur" }),
      user_region: string({ description: "La région de l'utilisateur" }),
      user_reseau: string({ description: "Le réseau de l'utilisateur" }),
      date: date({ description: "La date de l'event" }),
      type: string({ description: "Le type d'action" }),
      action: string({ description: "L'action ayant eu lieu" }),
      data: object({ description: "Les données liées à l'action" }),
    },
    {
      required: ["date"],
    }
  );
};

module.exports = {
  collectionName,
  schema,
};
