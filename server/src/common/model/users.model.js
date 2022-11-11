const { object, objectId, string, date, arrayOf } = require("./json-schema/jsonSchemaTypes");

const collectionName = "users";

const indexes = () => {
  return [[{ username: 1 }], [{ email: 1 }], [{ organisme: 1 }]];
};

const schema = () => {
  return object(
    {
      _id: objectId(),
      username: string({ description: "Le nom de l'utilisateur, utilisé pour l'authentification" }),
      email: string({ description: "Email de l'utilisateur" }),
      password: string({ description: "Le mot de passe hashed" }),
      password_update_token: string({ description: "Token généré afin de sécuriser le changement de mot de passe" }),
      password_update_token_expiry: date({
        description: "Date d'expiration du token généré afin de sécuriser le changement de mot de passe",
      }),
      permissions: arrayOf(string()),
      network: string({ description: "Le réseau de CFA de l'utilisateur s'il est précisé" }),
      region: string({ description: "La région de l'utilisateur s'il est précisé" }),
      organisme: string({ description: "L'organisme d'appartenance de l'utilisateur s'il est précisé" }),
      created_at: date({ description: "La date de création de l'utilisateur" }),
    },
    {
      required: ["username", "created_at"],
    }
  );
};

module.exports = {
  collectionName,
  schema,
  indexes,
};
