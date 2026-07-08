import { AxiosInstance } from "axiosist";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { brevoSyncSettingsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

const SYNC_SETTINGS_URL = "/api/v1/admin/brevo-contacts/sync-settings";

describe("Routes admin brevo-contacts/sync-settings", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });

  describe("GET /sync-settings", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(SYNC_SETTINGS_URL);
      expectUnauthorizedError(response);
    });

    it("Retourne les trois toggles désactivés par défaut (aucun document)", async () => {
      const response = await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "get", SYNC_SETTINGS_URL);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({
        dailyFullSyncEnabled: false,
        instantSyncEnabled: false,
        eventsEnabled: false,
      });
    });
  });

  describe("PUT /sync-settings", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(SYNC_SETTINGS_URL, { field: "dailyFullSyncEnabled", enabled: false });
      expectUnauthorizedError(response);
    });

    it("Persiste la désactivation d'un toggle (autorisée hors prod)", async () => {
      const response = await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "put", SYNC_SETTINGS_URL, {
        field: "instantSyncEnabled",
        enabled: false,
      });

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({
        dailyFullSyncEnabled: false,
        instantSyncEnabled: false,
        eventsEnabled: false,
      });
      const doc = await brevoSyncSettingsDb().findOne({ key: "brevo-contact-sync" });
      expect(doc?.instant_sync_enabled).toBe(false);
    });

    it("Refuse l'activation hors production (garde 400) et ne persiste rien", async () => {
      const response = await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "put", SYNC_SETTINGS_URL, {
        field: "dailyFullSyncEnabled",
        enabled: true,
      });

      expect(response.status).toBe(400);
      const doc = await brevoSyncSettingsDb().findOne({ key: "brevo-contact-sync" });
      expect(doc?.daily_full_sync_enabled ?? false).toBe(false);
    });

    it("Refuse un champ inconnu (validation 400)", async () => {
      const response = await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "put", SYNC_SETTINGS_URL, {
        field: "unknownToggle",
        enabled: false,
      });

      expect(response.status).toBe(400);
    });
  });
});
