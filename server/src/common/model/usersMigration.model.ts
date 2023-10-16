import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, string, boolean, any, arrayOf, date } from "./json-schema/jsonSchemaTypes";

export const collectionName = "usersMigration";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ email: 1 }, { unique: true }],
  [{ "emails.token": 1 }, {}],
  [{ email: "text", nom: "text", prenom: "text" }, {}],
  [{ organisation_id: 1 }, {}],
];

export const schema = object(
  {
    _id: objectId(),
    email: string({ description: "Email utilisateur" }),
    password: string({ description: "Le mot de passe hashé" }),
    civility: string({ description: "civilité", enum: ["Madame", "Monsieur"] }),
    nom: string({ description: "Le nom de l'utilisateur" }),
    prenom: string({ description: "Le prénom de l'utilisateur" }),
    telephone: string({ description: "Le téléphone de l'utilisateur" }),
    fonction: string({ description: "La fonction de l'utilisateur" }),
    organisation_id: objectId({
      description: "Organisation à laquelle appartient l'utilisateur",
    }),

    // Internal
    account_status: string({
      description: "Statut du compte",
      enum: ["PENDING_EMAIL_VALIDATION", "PENDING_ADMIN_VALIDATION", "CONFIRMED"],
    }),
    has_accept_cgu_version: string({ description: "Version des cgu accepté par l'utilisateur" }),
    created_at: date({ description: "Date de création du compte" }),
    last_connection: date({ description: "Date de dernière connexion" }),
    connection_history: arrayOf(date(), { description: "Historique des dates de connexion" }),
    invalided_token: boolean({ description: "true si besoin de reset le token" }),
    password_updated_at: date({ description: "Date de dernière mise à jour mot de passe" }),
    reminder_missing_data_sent_date: date({ description: "Date d'envoi de la relance email pour données manquantes" }),
    reminder_missing_configuration_and_data_sent_date: date({
      description: "Date d'envoi de la relance email pour configuration et données manquantes",
    }),
    emails: arrayOf(
      object(
        {
          token: string(),
          templateName: string(),
          payload: any(),
          sendDates: arrayOf(date()),
          openDate: date(),
          messageIds: arrayOf(string()),
          error: arrayOf(
            object({
              type: string({
                enum: ["fatal", "soft_bounce", "hard_bounce", "complaint", "invalid_email", "blocked", "error"],
              }),
              message: string(),
            })
          ),
        },
        { required: ["token", "templateName", "sendDates"], additionalProperties: true }
      )
    ),
    unsubscribe: boolean({ description: "unsubscribe email" }),
  },
  {
    required: ["email", "civility", "nom", "prenom", "password", "account_status", "organisation_id"],
    additionalProperties: true,
  }
);

export default { schema, indexes, collectionName };
