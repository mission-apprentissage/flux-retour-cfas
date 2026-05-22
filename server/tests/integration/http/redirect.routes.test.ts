import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

const FALLBACK_ML_URL = "https://www.unml.info/";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

const insertMlOrga = async (rdvUrl?: string | null): Promise<ObjectId> => {
  const id = new ObjectId();
  await organisationsDb().insertOne(
    {
      _id: id,
      type: "MISSION_LOCALE",
      nom: "ML Test",
      ml_id: 42,
      ...(rdvUrl !== undefined ? { rdv_url: rdvUrl } : {}),
      created_at: new Date(),
    } as any,
    { bypassDocumentValidation: true }
  );
  return id;
};

const insertEffectifWithToken = async (
  mlId: ObjectId,
  token: string,
  overrides: { tokenCreatedAt?: Date; softDeleted?: boolean } = {}
): Promise<ObjectId> => {
  const id = new ObjectId();
  await missionLocaleEffectifsDb().insertOne(
    {
      _id: id,
      mission_locale_id: mlId,
      effectif_id: new ObjectId(),
      created_at: new Date(),
      brevo: {},
      current_status: {},
      effectif_snapshot: {
        _id: new ObjectId(),
        organisme_id: new ObjectId(),
        id_erp_apprenant: "x",
        source: "test",
        annee_scolaire: "2024-2025",
        apprenant: { nom: "X", prenom: "Y", telephone: "0600000000" },
        formation: {},
        is_lock: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      whatsapp_contact: {
        phone_normalized: "+33600000000",
        rdv_redirect_token: token,
        rdv_redirect_token_created_at: overrides.tokenCreatedAt ?? new Date(),
        rdv_clicks: [],
      },
      ...(overrides.softDeleted ? { soft_deleted: true } : {}),
    } as any,
    { bypassDocumentValidation: true }
  );
  return id;
};

describe("Route GET /r/:token", () => {
  useMongo();

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    const db = getDatabase();
    await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
    await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
  });

  const waitForClicksLength = async (effectifId: ObjectId, expected: number): Promise<void> => {
    await vi.waitFor(async () => {
      const doc = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(doc?.whatsapp_contact?.rdv_clicks?.length).toBe(expected);
    });
  };

  it("token valide + rdv_url présent → 302 vers rdv_url + clic loggé", async () => {
    const rdvUrl = "https://calendly.com/ml-test";
    const mlId = await insertMlOrga(rdvUrl);
    const token = uuidv4();
    const effectifId = await insertEffectifWithToken(mlId, token);

    const response = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(rdvUrl);
    expect(response.headers["referrer-policy"]).toBe("no-referrer");

    await waitForClicksLength(effectifId, 1);
    const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
    expect(updated?.whatsapp_contact?.rdv_clicks?.[0].redirect_url).toBe(rdvUrl);
    expect(updated?.whatsapp_contact?.rdv_clicks?.[0].clicked_at).toBeInstanceOf(Date);
  });

  it("token inexistant → 302 vers fallback, pas de log", async () => {
    const response = await httpClient.get(`/r/${uuidv4()}`, { maxRedirects: 0, validateStatus: () => true });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(FALLBACK_ML_URL);

    const count = await missionLocaleEffectifsDb().countDocuments({
      "whatsapp_contact.rdv_clicks.0": { $exists: true },
    });
    expect(count).toBe(0);
  });

  it("token valide mais ML a supprimé rdv_url → 302 fallback, log avec redirect_url:null", async () => {
    const mlId = await insertMlOrga(); // pas de rdv_url
    const token = uuidv4();
    const effectifId = await insertEffectifWithToken(mlId, token);

    const response = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(FALLBACK_ML_URL);

    await waitForClicksLength(effectifId, 1);
    const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
    expect(updated?.whatsapp_contact?.rdv_clicks?.[0].redirect_url).toBeNull();
  });

  it("token expiré (>90j) → 302 fallback, pas de log", async () => {
    const mlId = await insertMlOrga("https://calendly.com/ml-test");
    const token = uuidv4();
    const expiredCreatedAt = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
    const effectifId = await insertEffectifWithToken(mlId, token, { tokenCreatedAt: expiredCreatedAt });

    const response = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(FALLBACK_ML_URL);

    const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
    expect(updated?.whatsapp_contact?.rdv_clicks?.length ?? 0).toBe(0);
  });

  it("effectif soft-deleted → 302 fallback, pas de log", async () => {
    const mlId = await insertMlOrga("https://calendly.com/ml-test");
    const token = uuidv4();
    const effectifId = await insertEffectifWithToken(mlId, token, { softDeleted: true });

    const response = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(FALLBACK_ML_URL);

    const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
    expect(updated?.whatsapp_contact?.rdv_clicks?.length ?? 0).toBe(0);
  });

  it("3 clics consécutifs → 3 entrées dans rdv_clicks", async () => {
    const mlId = await insertMlOrga("https://calendly.com/ml-test");
    const token = uuidv4();
    const effectifId = await insertEffectifWithToken(mlId, token);

    for (let i = 0; i < 3; i++) {
      const response = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });
      expect(response.status).toBe(302);
    }

    await waitForClicksLength(effectifId, 3);
  });

  it("rate-limit : >30 req/min sur le même token → 429", async () => {
    const mlId = await insertMlOrga("https://calendly.com/ml-test");
    const token = uuidv4();
    await insertEffectifWithToken(mlId, token);

    for (let i = 0; i < 30; i++) {
      const r = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });
      expect([302, 429]).toContain(r.status);
    }
    const blocked = await httpClient.get(`/r/${token}`, { maxRedirects: 0, validateStatus: () => true });
    expect(blocked.status).toBe(429);
  });
});
