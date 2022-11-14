const { object, objectId, string, date, stringOrNull, any } = require("./json-schema/jsonSchemaTypes");

const collectionName = "userEvents";

const indexes = () => {
  return [
    [{ username: 1 }, { name: "username" }],
    [{ action: 1 }, { name: "action" }],
  ];
};

const schema = object(
  {
    _id: objectId(),
    username: stringOrNull({ description: "Le nom de l'utilisateur, utilisé pour l'authentification" }),
    user_organisme: stringOrNull({ description: "L'organisme de l'utilisateur" }),
    user_region: stringOrNull({ description: "La région de l'utilisateur" }),
    user_network: stringOrNull({ description: "Le réseau de l'utilisateur" }),
    date: date({ description: "La date de l'event" }),
    type: stringOrNull({ description: "Le type d'action" }),
    action: string({ description: "L'action ayant eu lieu" }),
    data: any({ description: "Les données liées à l'action" }),
  },
  {
    required: ["date"],
  }
);

module.exports = {
  collectionName,
  schema,
  indexes,
};
