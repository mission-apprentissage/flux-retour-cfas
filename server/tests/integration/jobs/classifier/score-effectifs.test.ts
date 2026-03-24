import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { scoreExistingEffectifs } from "@/jobs/classifier/score-effectifs";
import { useMongo } from "@tests/jest/setupMongo";

const mockScoreEffectifs = vi.fn();

vi.mock("@/common/services/classifier/classifier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/services/classifier/classifier")>();
  return {
    ...actual,
    scoreEffectifs: (...args: unknown[]) => mockScoreEffectifs(...args),
  };
});

// Minimal fixture — schema validation is disabled in beforeEach
function createMlEffectifDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(),
    effectif_id: new ObjectId(),
    created_at: new Date(),
    soft_deleted: false,
    date_rupture: new Date("2025-12-01"),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2025-12-01") },
    brevo: { token: "test-token" },
    whatsapp_callback_requested: false,
    whatsapp_no_help_responded: false,
    effectif_snapshot: {
      _id: new ObjectId(),
      apprenant: {
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2002-07-28"),
        historique_statut: [],
      },
      formation: {
        date_inscription: new Date("2025-11-10"),
        date_fin: new Date("2027-05-09"),
        date_entree: new Date("2025-11-10"),
      },
      contrats: [
        {
          date_debut: new Date("2025-11-10"),
          date_fin: new Date("2027-05-09"),
          date_rupture: new Date("2025-12-15"),
        },
      ],
    },
    ...overrides,
  };
}

describe("scoreExistingEffectifs", () => {
  useMongo();

  beforeEach(async () => {
    mockScoreEffectifs.mockReset();
    mockScoreEffectifs.mockResolvedValue({ model: "2026-03-16", scores: [0.85] });

    // Disable schema validation for this test — we insert minimal docs directly
    await getDatabase().command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
  });

  it("score les effectifs sans classification_reponse_appel", async () => {
    await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc() as any);

    await scoreExistingEffectifs({ dryRun: false });

    const doc = await missionLocaleEffectifsDb().findOne({});
    expect(doc?.classification_reponse_appel).toBeDefined();
    expect(doc?.classification_reponse_appel?.score).toBe(0.85);
    expect(doc?.classification_reponse_appel?.model).toBe("2026-03-16");
    expect(mockScoreEffectifs).toHaveBeenCalledOnce();
  });

  it("ignore les effectifs soft_deleted", async () => {
    await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc({ soft_deleted: true }) as any);

    await scoreExistingEffectifs({ dryRun: false });

    expect(mockScoreEffectifs).not.toHaveBeenCalled();
  });

  it("ignore les effectifs qui ont déjà un score", async () => {
    await missionLocaleEffectifsDb().insertOne(
      createMlEffectifDoc({
        classification_reponse_appel: { score: 0.5, model: "old", scored_at: new Date() },
      }) as any
    );

    await scoreExistingEffectifs({ dryRun: false });

    expect(mockScoreEffectifs).not.toHaveBeenCalled();
  });

  it("skip les effectifs sans données suffisantes", async () => {
    await missionLocaleEffectifsDb().insertOne(
      createMlEffectifDoc({
        effectif_snapshot: {
          _id: new ObjectId(),
          apprenant: { nom: "TEST", prenom: "Test", historique_statut: [] },
          contrats: [],
        },
      }) as any
    );

    await scoreExistingEffectifs({ dryRun: false });

    expect(mockScoreEffectifs).not.toHaveBeenCalled();
    const doc = await missionLocaleEffectifsDb().findOne({});
    expect(doc?.classification_reponse_appel).toBeUndefined();
  });

  it("respecte l'option limit", async () => {
    mockScoreEffectifs.mockResolvedValue({ model: "2026-03-16", scores: [0.8] });

    await missionLocaleEffectifsDb().insertMany([
      createMlEffectifDoc(),
      createMlEffectifDoc(),
      createMlEffectifDoc(),
    ] as any);

    await scoreExistingEffectifs({ dryRun: false, limit: 1 });

    expect(mockScoreEffectifs).toHaveBeenCalledOnce();
    const scored = await missionLocaleEffectifsDb().countDocuments({ classification_reponse_appel: { $exists: true } });
    expect(scored).toBe(1);
  });

  it("en dryRun, ne modifie pas la base", async () => {
    await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc() as any);

    await scoreExistingEffectifs({ dryRun: true });

    expect(mockScoreEffectifs).not.toHaveBeenCalled();
    const doc = await missionLocaleEffectifsDb().findOne({});
    expect(doc?.classification_reponse_appel).toBeUndefined();
  });

  it("gère l'erreur du classifier sans crash", async () => {
    mockScoreEffectifs.mockRejectedValue(new Error("Classifier down"));

    await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc() as any);

    const result = await scoreExistingEffectifs({ dryRun: false });

    expect(result).toBe(1);
    const doc = await missionLocaleEffectifsDb().findOne({});
    expect(doc?.classification_reponse_appel).toBeUndefined();
  });

  it("ignore les effectifs avec une situation renseignée (déjà traités ou à recontacter)", async () => {
    await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc({ situation: "CONTACTE_SANS_RETOUR" }) as any);
    await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc({ situation: "RDV_PRIS" }) as any);

    await scoreExistingEffectifs({ dryRun: false });

    expect(mockScoreEffectifs).not.toHaveBeenCalled();
  });
});
