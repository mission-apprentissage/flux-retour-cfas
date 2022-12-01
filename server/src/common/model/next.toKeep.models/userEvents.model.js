import { object, objectId, string, date, stringOrNull, any } from "../json-schema/jsonSchemaTypes.js";

export const collectionName = "userEvents";

export const indexes = () => {
  return [
    [{ username: 1 }, { name: "username" }],
    [{ user_email: 1 }, { name: "user_email" }],
    [{ action: 1 }, { name: "action" }],
  ];
};

const schema = object(
  {
    _id: objectId(),
    // TODO remove une fois la migration effectuée
    username: stringOrNull({ description: "Le nom de l'utilisateur, utilisé pour l'authentification" }),
    user_email: stringOrNull({ description: "L'email de l'utilisateur, utilisé pour l'authentification" }),
    date: date({ description: "La date de l'event" }),
    type: stringOrNull({ description: "Le type d'action" }),
    action: string({ description: "L'action ayant eu lieu" }),
    data: any({ description: "Les données liées à l'action" }),
  },
  {
    required: ["date"],
  }
);

export default { schema, indexes, collectionName };
