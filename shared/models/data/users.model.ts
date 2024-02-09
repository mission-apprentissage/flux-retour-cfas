import type { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, string, stringOrNull, date, arrayOf, dateOrNull } from "shared";

const collectionName = "users";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ username: 1 }, { name: "username" }],
  [{ email: 1 }, { name: "email" }],
  [{ organisme: 1 }, { name: "organisme" }],
];

const schema = object(
  {
    _id: objectId(),
    username: string({ description: "Le nom de l'utilisateur, utilisé pour l'authentification" }),
    email: stringOrNull({ description: "Email de l'utilisateur" }),
    password: string({ description: "Le mot de passe hashed" }),
    password_update_token: stringOrNull({
      description: "Token généré afin de sécuriser le changement de mot de passe",
    }),
    password_update_token_expiry: dateOrNull({
      description: "Date d'expiration du token généré afin de sécuriser le changement de mot de passe",
    }),
    permissions: arrayOf(string()),
    last_connection: date({ description: "Date de dernière connexion" }),
    network: stringOrNull({ description: "Le réseau de CFA de l'utilisateur s'il est précisé" }),
    region: stringOrNull({ description: "La région de l'utilisateur s'il est précisé" }),
    organisme: stringOrNull({ description: "L'organisme d'appartenance de l'utilisateur s'il est précisé" }),
    created_at: date({ description: "La date de création de l'utilisateur" }),
  },
  {
    required: ["username", "created_at"],
    additionalProperties: true, // Temporary for archive
  }
);

export default { schema, indexes, collectionName };
