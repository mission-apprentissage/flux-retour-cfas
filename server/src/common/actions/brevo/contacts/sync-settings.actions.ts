import Boom from "boom";
import { MongoServerError } from "mongodb";
import type { IBrevoSyncSettings } from "shared/models/data/brevoSyncSettings.model";

import { brevoSyncSettingsDb } from "@/common/model/collections";
import config from "@/config";

/**
 * Pilotage des synchronisations et événements Brevo via des toggles persistés en base
 *
 * Sécurité : les toggles qui déclenchent un appel à Brevo ne sont **activables
 * qu'en production**.
 * - Garde 1 : `setBrevoSyncSetting` refuse de persister `true` hors prod.
 * - Garde 2 : `isBrevo*Active` re-vérifie `config.env === "production"` à la
 *   lecture, donc un flag à `true` qui traînerait en base (ex: dump prod
 *   restauré en recette) reste inopérant hors prod.
 */
const SETTINGS_KEY = "brevo-contact-sync" as const;

export type BrevoSyncSettingField =
  | "dailyFullSyncEnabled"
  | "instantSyncEnabled"
  | "eventsEnabled"
  | "mlGenericContactsEnabled";

export type BrevoSyncSettings = {
  dailyFullSyncEnabled: boolean;
  instantSyncEnabled: boolean;
  eventsEnabled: boolean;
  mlGenericContactsEnabled: boolean;
};

type BrevoSyncSettingDbField =
  | "daily_full_sync_enabled"
  | "instant_sync_enabled"
  | "events_enabled"
  | "ml_generic_contacts_enabled";

const FIELD_TO_DB: Record<BrevoSyncSettingField, BrevoSyncSettingDbField> = {
  dailyFullSyncEnabled: "daily_full_sync_enabled",
  instantSyncEnabled: "instant_sync_enabled",
  eventsEnabled: "events_enabled",
  mlGenericContactsEnabled: "ml_generic_contacts_enabled",
};

const ALL_DB_FIELDS: BrevoSyncSettingDbField[] = [
  "daily_full_sync_enabled",
  "instant_sync_enabled",
  "events_enabled",
  "ml_generic_contacts_enabled",
];

/**
 * Toggles réservés à la production, car chacun déclenche des appels à Brevo.
 *
 * `mlGenericContactsEnabled` n'y figure volontairement PAS : il ne fait que
 * décider si les adresses génériques des ML entrent dans le périmètre des
 * contacts construits, sans jamais provoquer d'appel réseau par lui-même — tout
 * envoi reste gardé par les trois toggles ci-dessous ET par `config.env`. Le
 * rendre prod-only rendrait par ailleurs impossible toute recette locale par
 * `--dry-run`. Ne pas l'ajouter ici.
 */
const PROD_ONLY_FIELDS: BrevoSyncSettingField[] = ["dailyFullSyncEnabled", "instantSyncEnabled", "eventsEnabled"];

const toSettings = (doc: IBrevoSyncSettings | null): BrevoSyncSettings => ({
  dailyFullSyncEnabled: doc?.daily_full_sync_enabled ?? false,
  instantSyncEnabled: doc?.instant_sync_enabled ?? false,
  eventsEnabled: doc?.events_enabled ?? false,
  mlGenericContactsEnabled: doc?.ml_generic_contacts_enabled ?? false,
});

export const getBrevoSyncSettings = async (): Promise<BrevoSyncSettings> => {
  return toSettings(await brevoSyncSettingsDb().findOne({ key: SETTINGS_KEY }));
};

export const setBrevoSyncSetting = async (
  field: BrevoSyncSettingField,
  enabled: boolean,
  userEmail: string
): Promise<BrevoSyncSettings> => {
  if (enabled && PROD_ONLY_FIELDS.includes(field) && config.env !== "production") {
    throw Boom.badRequest("La synchronisation Brevo n'est activable qu'en production");
  }
  const dbField = FIELD_TO_DB[field];
  // Les autres toggles sont initialisés à `false` à la création pour garantir que
  // les booléens du schéma existent dès le premier upsert. La `key` est posée
  // automatiquement par le filtre de l'upsert, pas besoin de la répéter.
  const setOnInsert = Object.fromEntries(ALL_DB_FIELDS.filter((f) => f !== dbField).map((f) => [f, false]));
  const set = { [dbField]: enabled, updated_at: new Date(), updated_by: userEmail };

  try {
    // `findOneAndUpdate` + `returnDocument: "after"` : une seule requête (l'état
    // à jour est renvoyé directement, pas de second `findOne`).
    const res = await brevoSyncSettingsDb().findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: set, $setOnInsert: setOnInsert },
      { upsert: true, returnDocument: "after" }
    );
    return toSettings(res);
  } catch (err) {
    // Race E11000 : un autre upsert a créé le document en parallèle (index unique
    // sur `key`). Le document existe désormais → simple update sans upsert.
    if (!(err instanceof MongoServerError) || err.code !== 11000) throw err;
    const res = await brevoSyncSettingsDb().findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: set },
      { returnDocument: "after" }
    );
    return toSettings(res);
  }
};

// Gardes effectives (flag persisté ET production).
export const isBrevoDailyFullSyncActive = async (): Promise<boolean> =>
  config.env === "production" && (await getBrevoSyncSettings()).dailyFullSyncEnabled;

export const isBrevoInstantSyncActive = async (): Promise<boolean> =>
  config.env === "production" && (await getBrevoSyncSettings()).instantSyncEnabled;

// Émission d'événements Brevo : PRODUCTION UNIQUEMENT (garde 2). Même hors prod avec
// un flag `events_enabled: true` en base, cette fonction renvoie false → aucun envoi.
export const isBrevoEventsActive = async (): Promise<boolean> =>
  config.env === "production" && (await getBrevoSyncSettings()).eventsEnabled;

/**
 * Contrairement aux trois autres : pas de garde `config.env`. Ce toggle ne
 * déclenche aucun appel à Brevo, il définit un périmètre de contacts — et doit
 * rester évaluable hors prod pour la recette par `--dry-run`.
 */
export const isBrevoMlGenericContactsActive = async (): Promise<boolean> =>
  (await getBrevoSyncSettings()).mlGenericContactsEnabled;
