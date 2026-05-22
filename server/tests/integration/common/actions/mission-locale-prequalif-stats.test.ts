import { ObjectId } from "mongodb";
import { describe, beforeEach, it, expect } from "vitest";

import { getPrequalifStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

describe("getPrequalifStats", () => {
  useMongo();

  beforeEach(async () => {
    const db = getDatabase();
    await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
    await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
  });

  const insertMl = async (overrides: { region?: string; rdvUrl?: string | null } = {}): Promise<ObjectId> => {
    const id = new ObjectId();
    await organisationsDb().insertOne(
      {
        _id: id,
        type: "MISSION_LOCALE",
        nom: "ML",
        ml_id: Math.floor(Math.random() * 100000),
        created_at: new Date(),
        ...(overrides.region ? { adresse: { region: overrides.region } } : {}),
        ...(overrides.rdvUrl !== undefined ? { rdv_url: overrides.rdvUrl } : {}),
      } as any,
      { bypassDocumentValidation: true }
    );
    return id;
  };

  const insertEffectifPrequalif = async (
    mlId: ObjectId,
    overrides: {
      sentVia?: "backfill" | "daily";
      userResponse?: "prequalif_yes" | "prequalif_no";
      optedOut?: boolean;
      messageStatus?: "sent" | "failed_send" | "failed" | "pending";
      autoReplySent?: boolean;
      rdvToken?: string;
      rdvClicks?: number;
      templateType?: "prequalif" | "injoignables";
      sentAt?: Date;
    } = {}
  ): Promise<void> => {
    await missionLocaleEffectifsDb().insertOne(
      {
        _id: new ObjectId(),
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
          phone_normalized: `+33${Math.floor(Math.random() * 1e9)
            .toString()
            .padStart(9, "0")}`,
          template_type: overrides.templateType ?? "prequalif",
          sent_via: overrides.sentVia ?? "daily",
          last_message_sent_at: overrides.sentAt ?? new Date(),
          message_status: overrides.messageStatus ?? "sent",
          ...(overrides.userResponse ? { user_response: overrides.userResponse } : {}),
          ...(overrides.optedOut ? { opted_out: true } : {}),
          ...(overrides.autoReplySent ? { auto_reply_sent: true } : {}),
          ...(overrides.rdvToken ? { rdv_redirect_token: overrides.rdvToken } : {}),
          ...(overrides.rdvClicks
            ? {
                rdv_clicks: Array.from({ length: overrides.rdvClicks }, () => ({
                  clicked_at: new Date(),
                  redirect_url: "https://calendly.com/ml",
                })),
              }
            : { rdv_clicks: [] }),
        },
      } as any,
      { bypassDocumentValidation: true }
    );
  };

  it("scope national : compte tous les envois préqualif, exclut les injoignables", async () => {
    const mlA = await insertMl();
    const mlB = await insertMl();

    await insertEffectifPrequalif(mlA, { sentVia: "backfill" });
    await insertEffectifPrequalif(mlA, { sentVia: "daily", userResponse: "prequalif_yes" });
    await insertEffectifPrequalif(mlB, { sentVia: "daily", userResponse: "prequalif_no" });
    // Cet effectif legacy injoignables ne doit PAS être compté
    await insertEffectifPrequalif(mlA, { templateType: "injoignables", userResponse: "prequalif_yes" });

    const stats = await getPrequalifStats({ national: true });

    expect(stats.scope).toEqual({ type: "national" });
    expect(stats.volume.total_sent).toBe(3);
    expect(stats.volume.sent_by_mode).toEqual({ backfill: 1, daily: 2 });
    expect(stats.responses.yes_count).toBe(1);
    expect(stats.responses.no_count).toBe(1);
  });

  it("scope ml_id : isole les envois d'une seule ML", async () => {
    const mlA = await insertMl();
    const mlB = await insertMl();

    await insertEffectifPrequalif(mlA, { userResponse: "prequalif_yes" });
    await insertEffectifPrequalif(mlA);
    await insertEffectifPrequalif(mlB, { userResponse: "prequalif_yes" });
    await insertEffectifPrequalif(mlB);
    await insertEffectifPrequalif(mlB);

    const statsA = await getPrequalifStats({ ml_id: mlA });
    const statsB = await getPrequalifStats({ ml_id: mlB });

    expect(statsA.volume.total_sent).toBe(2);
    expect(statsA.responses.yes_count).toBe(1);
    expect(statsB.volume.total_sent).toBe(3);
    expect(statsB.responses.yes_count).toBe(1);
  });

  it("scope region : ne compte que les ML de la région demandée", async () => {
    const mlIDF = await insertMl({ region: "11" });
    const mlBretagne = await insertMl({ region: "53" });

    await insertEffectifPrequalif(mlIDF);
    await insertEffectifPrequalif(mlIDF);
    await insertEffectifPrequalif(mlBretagne);

    const statsIDF = await getPrequalifStats({ region: "11" });
    const statsBretagne = await getPrequalifStats({ region: "53" });

    expect(statsIDF.volume.total_sent).toBe(2);
    expect(statsBretagne.volume.total_sent).toBe(1);
  });

  it("ml_activation : null si scope ml_id, calculé sinon", async () => {
    await insertMl({ rdvUrl: "https://calendly.com/a" });
    await insertMl({ rdvUrl: "https://calendly.com/b" });
    const mlC = await insertMl(); // pas de rdv_url

    await insertEffectifPrequalif(mlC);

    const statsNational = await getPrequalifStats({ national: true });
    expect(statsNational.ml_activation).toEqual({ ml_with_rdv_url: 2, ml_total: 3 });

    const statsMl = await getPrequalifStats({ ml_id: mlC });
    expect(statsMl.ml_activation).toBeNull();
  });

  it("yes_rate / response_rate : 0% si aucun répondant (pas de NaN)", async () => {
    const mlA = await insertMl();
    await insertEffectifPrequalif(mlA);

    const stats = await getPrequalifStats({ national: true });

    expect(stats.volume.total_sent).toBe(1);
    expect(stats.responses.yes_count).toBe(0);
    expect(stats.responses.no_count).toBe(0);
    expect(stats.responses.response_rate).toBe(0);
    expect(stats.responses.yes_rate).toBe(0);
  });

  it("rdv_tracking : agrège tokens, clics et cliqueurs uniques", async () => {
    const mlA = await insertMl();

    await insertEffectifPrequalif(mlA, { rdvToken: "uuid-1", rdvClicks: 3 });
    await insertEffectifPrequalif(mlA, { rdvToken: "uuid-2", rdvClicks: 1 });
    await insertEffectifPrequalif(mlA, { rdvToken: "uuid-3", rdvClicks: 0 });

    const stats = await getPrequalifStats({ national: true });

    expect(stats.rdv_tracking.tokens_generated).toBe(3);
    expect(stats.rdv_tracking.total_clicks).toBe(4);
    expect(stats.rdv_tracking.unique_clickers).toBe(2);
  });

  it("compte failed_send et opt-out STOP séparément", async () => {
    const mlA = await insertMl();

    await insertEffectifPrequalif(mlA, { messageStatus: "failed_send" });
    await insertEffectifPrequalif(mlA, { messageStatus: "failed_send" });
    await insertEffectifPrequalif(mlA, { optedOut: true });

    const stats = await getPrequalifStats({ national: true });

    expect(stats.volume.failed_send).toBe(2);
    expect(stats.volume.opted_out).toBe(1);
  });
});
