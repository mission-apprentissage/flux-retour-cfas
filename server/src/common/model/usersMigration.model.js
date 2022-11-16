import Joi from "joi";
import { integer, object, objectId, string, boolean, arrayOf, date } from "./json-schema/jsonSchemaTypes.js";
import { schemaValidation } from "../utils/schemaUtils.js";
import { siretSchema, passwordSchema } from "../utils/validationUtils.js";

export const collectionName = "usersMigration";

export function indexes() {
  return [[{ email: 1 }, { unique: true }], [{ "emails.token": 1 }]];
}

export function schema() {
  return object(
    {
      _id: objectId(),
      email: string({ description: "Email utilisateur" }),
      password: string({ description: "Le mot de passe hashé" }),
      civility: string({ description: "civilité", enum: ["Madame", "Monsieur"] }),
      nom: string({ description: "Le nom de l'utilisateur" }),
      prenom: string({ description: "Le prénom de l'utilisateur" }),
      telephone: string({ description: "Le téléphone de l'utilisateur" }),
      siret: string({ description: "N° SIRET", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }),
      account_status: string({
        description: "Statut du compte",
        enum: ["NOT_CONFIRMED", "FORCE_RESET_PASSWORD", "FORCE_COMPLETE_PROFILE", "CONFIRMED"],
      }),
      has_accept_cgu_version: string({ description: "Version des cgu accepté par l'utilisateur" }),
      orign_register: string({ description: "Origine de l'inscription", enum: ["ORIGIN"] }),
      is_admin: boolean({ description: "true si l'utilisateur est administrateur" }),
      roles: arrayOf(objectId(), { description: "Roles de l'utilisateur" }),
      custom_acl: arrayOf(string(), { description: "Custom Access control level array" }),
      created_at: date({ description: "Date de création du compte" }),
      last_connection: date({ description: "Date de dernière connexion" }),
      connection_history: arrayOf(date(), { description: "Historique des dates de connexion" }),
      invalided_token: boolean({ description: "true si besoin de reset le token" }),
      password_updated_at: date({ description: "Date de dernière mise à jour mot de passe" }),
      emails: arrayOf(
        object(
          {
            token: string(),
            templateName: string(),
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
          { required: ["token", "templateName", "sendDates"] }
        )
      ),
      unsubscribe: boolean({ description: "unsubscribe email" }),
      v: integer(),
    },
    { required: ["email"], additionalProperties: true }
  );
}

// Default value
export function defaultValuesUser() {
  return {
    account_status: "NOT_CONFIRMED",
    orign_register: "ORIGIN",
    has_accept_cgu_version: "",
    is_admin: false,
    roles: [],
    custom_acl: [],
    invalided_token: false,
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
  };
}

// Extra validation
export function validateUser(props) {
  return schemaValidation(props, schema(), [
    {
      name: "email",
      base: Joi.string().email(),
    },
    {
      name: "password",
      base: passwordSchema(),
    },
    {
      name: "siret",
      base: siretSchema(),
    },
  ]);
}
