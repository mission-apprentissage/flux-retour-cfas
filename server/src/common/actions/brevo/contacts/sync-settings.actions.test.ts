import { describe, expect, it } from "vitest";

import { brevoSyncSettingsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import {
  getBrevoSyncSettings,
  isBrevoDailyFullSyncActive,
  isBrevoInstantSyncActive,
  setBrevoSyncSetting,
} from "./sync-settings.actions";

useMongo();

// Note : en environnement de test, `config.env === "test"` (≠ "production").
describe("sync-settings.actions", () => {
  it("retourne les deux toggles désactivés par défaut (aucun document)", async () => {
    expect(await getBrevoSyncSettings()).toEqual({
      dailyFullSyncEnabled: false,
      instantSyncEnabled: false,
    });
  });

  it("persiste la désactivation, initialise l'autre champ et trace l'auteur", async () => {
    const result = await setBrevoSyncSetting("instantSyncEnabled", false, "admin@example.com");

    expect(result).toEqual({ dailyFullSyncEnabled: false, instantSyncEnabled: false });
    const doc = await brevoSyncSettingsDb().findOne({ key: "brevo-contact-sync" });
    expect(doc).toMatchObject({
      key: "brevo-contact-sync",
      instant_sync_enabled: false,
      daily_full_sync_enabled: false,
      updated_by: "admin@example.com",
    });
  });

  it("met à jour un seul toggle sans écraser l'autre", async () => {
    // On sème un document avec instantSync déjà actif (insert direct → contourne
    // la garde prod, comme le ferait un toggle activé en production).
    await brevoSyncSettingsDb().insertOne({
      key: "brevo-contact-sync",
      daily_full_sync_enabled: false,
      instant_sync_enabled: true,
    } as any);

    // On modifie daily : instant doit rester à true.
    const result = await setBrevoSyncSetting("dailyFullSyncEnabled", false, "b@example.com");

    expect(result).toEqual({ dailyFullSyncEnabled: false, instantSyncEnabled: true });
    const doc = await brevoSyncSettingsDb().findOne({ key: "brevo-contact-sync" });
    expect(doc?.instant_sync_enabled).toBe(true);
    expect(doc?.updated_by).toBe("b@example.com");
  });

  it("refuse l'activation hors production (garde 1)", async () => {
    await expect(setBrevoSyncSetting("dailyFullSyncEnabled", true, "admin@example.com")).rejects.toThrow();
    const doc = await brevoSyncSettingsDb().findOne({ key: "brevo-contact-sync" });
    expect(doc?.daily_full_sync_enabled ?? false).toBe(false);
  });

  it("gardes effectives false hors production même si les flags sont true en base (garde 2)", async () => {
    await brevoSyncSettingsDb().insertOne({
      key: "brevo-contact-sync",
      daily_full_sync_enabled: true,
      instant_sync_enabled: true,
    } as any);

    expect(await isBrevoDailyFullSyncActive()).toBe(false);
    expect(await isBrevoInstantSyncActive()).toBe(false);
  });
});
