import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "brevoSyncSettings";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ key: 1 }, { unique: true }]];

export const zBrevoSyncSettings = z.object({
  _id: zObjectId,
  key: z.literal("brevo-contact-sync").describe("Discriminant du document singleton de configuration"),
  daily_full_sync_enabled: z.boolean().describe("Active le cron quotidien de synchro full vers Brevo"),
  instant_sync_enabled: z
    .boolean()
    .describe("Active la synchro instantanée unitaire (création de compte / changement de statut)"),
  // Optionnel pour rétrocompat : les documents créés avant l'ajout des événements
  // n'ont pas ce champ ; `toSettings` le lit avec `?? false`.
  events_enabled: z
    .boolean()
    .optional()
    .describe("Active l'émission d'événements Brevo (API Events) sur transitions métier — prod uniquement"),
  updated_at: z.date().optional().describe("Date de dernière modification d'un toggle"),
  updated_by: z.string().optional().describe("Email de l'administrateur ayant modifié un toggle"),
});

export type IBrevoSyncSettings = z.output<typeof zBrevoSyncSettings>;
export default { zod: zBrevoSyncSettings, collectionName, indexes };
