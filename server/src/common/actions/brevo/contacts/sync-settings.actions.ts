import Boom from "boom";
import type { IBrevoSyncSettings } from "shared/models/data/brevoSyncSettings.model";

import { brevoSyncSettingsDb } from "@/common/model/collections";
import config from "@/config";

/**
 * Pilotage des synchronisations Brevo via deux toggles persistés en base
 * (document singleton `key: "brevo-contact-sync"`).
 *
 * Sécurité : ces synchronisations ne sont **activables qu'en production**.
 * - Garde 1 : `setBrevoSyncSetting` refuse de persister `true` hors prod.
 * - Garde 2 : `isBrevo*Active` re-vérifie `config.env === "production"` à la
 *   lecture, donc un flag à `true` qui traînerait en base (ex: dump prod
 *   restauré en recette) reste inopérant hors prod.
 */
const SETTINGS_KEY = "brevo-contact-sync" as const;

export type BrevoSyncSettingField = "dailyFullSyncEnabled" | "instantSyncEnabled";

export type BrevoSyncSettings = {
  dailyFullSyncEnabled: boolean;
  instantSyncEnabled: boolean;
};

const FIELD_TO_DB: Record<BrevoSyncSettingField, "daily_full_sync_enabled" | "instant_sync_enabled"> = {
  dailyFullSyncEnabled: "daily_full_sync_enabled",
  instantSyncEnabled: "instant_sync_enabled",
};

const toSettings = (doc: IBrevoSyncSettings | null): BrevoSyncSettings => ({
  dailyFullSyncEnabled: doc?.daily_full_sync_enabled ?? false,
  instantSyncEnabled: doc?.instant_sync_enabled ?? false,
});

export const getBrevoSyncSettings = async (): Promise<BrevoSyncSettings> => {
  return toSettings(await brevoSyncSettingsDb().findOne({ key: SETTINGS_KEY }));
};

export const setBrevoSyncSetting = async (
  field: BrevoSyncSettingField,
  enabled: boolean,
  userEmail: string
): Promise<BrevoSyncSettings> => {
  if (enabled && config.env !== "production") {
    throw Boom.badRequest("La synchronisation Brevo n'est activable qu'en production");
  }
  const dbField = FIELD_TO_DB[field];
  // L'autre toggle est initialisé à `false` à la création pour garantir que les
  // deux booléens (requis par le schéma) existent dès le premier upsert. La `key`
  // est posée automatiquement par le filtre de l'upsert, pas besoin de la répéter.
  const otherDbField = field === "dailyFullSyncEnabled" ? "instant_sync_enabled" : "daily_full_sync_enabled";
  const set = { [dbField]: enabled, updated_at: new Date(), updated_by: userEmail };

  try {
    // `findOneAndUpdate` + `returnDocument: "after"` : une seule requête (l'état
    // à jour est renvoyé directement, pas de second `findOne`).
    const res = await brevoSyncSettingsDb().findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: set, $setOnInsert: { [otherDbField]: false } },
      { upsert: true, returnDocument: "after" }
    );
    return toSettings(res.value);
  } catch (err: any) {
    // Race E11000 : un autre upsert a créé le document en parallèle (index unique
    // sur `key`). Le document existe désormais → simple update sans upsert.
    if (err?.code !== 11000) throw err;
    const res = await brevoSyncSettingsDb().findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: set },
      { returnDocument: "after" }
    );
    return toSettings(res.value);
  }
};

// Gardes effectives (flag persisté ET production).
export const isBrevoDailyFullSyncActive = async (): Promise<boolean> =>
  config.env === "production" && (await getBrevoSyncSettings()).dailyFullSyncEnabled;

export const isBrevoInstantSyncActive = async (): Promise<boolean> =>
  config.env === "production" && (await getBrevoSyncSettings()).instantSyncEnabled;
