import { object, objectId, string, date } from "./json-schema/jsonSchemaTypes.js";

export const collectionName = "userEvents";

export const indexes = () => {
  return [
    [{ username: 1 }, { name: "username" }],
    [{ action: 1 }, { name: "action" }],
  ];
};

export const schema = () => {
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

export default { schema, indexes, collectionName };
