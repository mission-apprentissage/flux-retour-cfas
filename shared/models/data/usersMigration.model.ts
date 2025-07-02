import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import type { Jsonify } from "type-fest";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "usersMigration";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ email: 1 }, { unique: true }],
  [{ "emails.token": 1 }, {}],
  [{ email: "text", nom: "text", prenom: "text" }, {}],
  [{ organisation_id: 1 }, {}],
];

export const zUsersMigration = z.object({
  _id: zObjectId,
  email: z.string().describe("Email utilisateur"),
  password: z.string().describe("Le mot de passe hashé"),
  civility: z.enum(["Madame", "Monsieur"]).describe("civilité"),
  nom: z.string().describe("Le nom de l'utilisateur"),
  prenom: z.string().describe("Le prénom de l'utilisateur"),
  telephone: z.string().optional().describe("Le téléphone de l'utilisateur"),
  fonction: z.string().optional().describe("La fonction de l'utilisateur"),
  organisation_id: zObjectId.describe("Organisation à laquelle appartient l'utilisateur"),

  // Internal
  account_status: z
    .enum(["PENDING_EMAIL_VALIDATION", "PENDING_ADMIN_VALIDATION", "CONFIRMED"])
    .describe("Statut du compte"),
  has_accept_cgu_version: z.string().optional().describe("Version des cgu accepté par l'utilisateur"),
  created_at: z.date().optional().describe("Date de création du compte"),
  last_connection: z.date().optional().describe("Date de dernière connexion"),
  connection_history: z.array(z.date()).optional().describe("Historique des dates de connexion"),
  password_updated_at: z.date().optional().describe("Date de dernière mise à jour mot de passe"),
  reminder_missing_data_sent_date: z
    .date()
    .optional()
    .describe("Date d'envoi de la relance email pour données manquantes"),
  reminder_missing_configuration_and_data_sent_date: z
    .date()
    .optional()
    .describe("Date d'envoi de la relance email pour configuration et données manquantes"),
  emails: z
    .array(
      z
        .object({
          token: z.string(),
          templateName: z.string(),
          payload: z.any().optional(),
          sendDates: z.array(z.date()),
          openDate: z.date().optional(),
          messageIds: z.array(z.string()).optional(),
          error: z
            .array(
              z.object({
                type: z
                  .enum(["fatal", "soft_bounce", "hard_bounce", "complaint", "invalid_email", "blocked", "error"])
                  .optional(),
                message: z.string().optional(),
              })
            )
            .optional(),
        })
        .nonstrict()
    )
    .optional(),
  unsubscribe: z.boolean().optional().describe("unsubscribe email"),
});

export type IUsersMigration = z.output<typeof zUsersMigration>;
export type IUsersMigrationJson = Jsonify<IUsersMigration>;

export default { zod: zUsersMigration, indexes, collectionName };
