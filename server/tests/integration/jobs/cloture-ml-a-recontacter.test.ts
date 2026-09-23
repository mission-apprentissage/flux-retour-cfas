import { ObjectId } from "bson";
import type { IMissionLocaleEffectif } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { clotureMlARecontacter } from "@/jobs/migration/cloture-ml-a-recontacter";
import { useMongo } from "@tests/jest/setupMongo";
import { testDocs } from "@tests/utils/testUtils";

vi.mock("@/common/actions/mission-locale/mission-locale-stats.actions", () => ({
  createOrUpdateMissionLocaleStats: vi.fn(),
}));

const ML_ID = new ObjectId();
const AUTRE_ML_ID = new ObjectId();

function createMlEffectifDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    mission_locale_id: ML_ID,
    effectif_id: new ObjectId(),
    situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
    date_dernier_passage_a_recontacter: new Date("2026-04-15T10:00:00Z"),
    date_derniere_action_ml: new Date("2026-04-15T10:00:00Z"),
    commentaires: "Message laissé sur le répondeur",
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: new Date("2026-04-15T10:00:00Z"),
    ...overrides,
  };
}

describe("clotureMlARecontacter", () => {
  useMongo();

  beforeEach(async () => {
    vi.mocked(createOrUpdateMissionLocaleStats).mockClear();
    await getDatabase().command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
  });

  it("clôture un dossier resté à recontacter avant juin, deux mois après le passage", async () => {
    const doc = createMlEffectifDoc();
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    await clotureMlARecontacter({ dryRun: false });

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.situation).toBe(SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES);
    expect(after?.date_traitement).toEqual(new Date("2026-06-15T10:00:00Z"));
    expect(after?.date_derniere_action_ml).toEqual(doc.date_derniere_action_ml);
    expect(after?.commentaires).toBe("Message laissé sur le répondeur");

    const logs = await missionLocaleEffectifsLogDb().find({ mission_locale_effectif_id: doc._id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
      commentaires:
        "Le jeune n’a pas répondu aux tentatives de contact de la Mission Locale depuis 61 jours. Son dossier a été clôturé automatiquement.",
      created_at: new Date("2026-06-15T10:00:00Z"),
      created_by: null,
    });

    expect(createOrUpdateMissionLocaleStats).toHaveBeenCalledWith(ML_ID);
  });

  it("ignore les dossiers passés à recontacter après le 31/05, les autres situations et les soft-deleted", async () => {
    const recent = createMlEffectifDoc({ date_dernier_passage_a_recontacter: new Date("2026-05-31T22:30:00Z") });
    const traite = createMlEffectifDoc({ situation: SITUATION_ENUM.RDV_PRIS });
    const softDeleted = createMlEffectifDoc({ soft_deleted: true });
    const limite = createMlEffectifDoc({
      mission_locale_id: AUTRE_ML_ID,
      date_dernier_passage_a_recontacter: new Date("2026-05-31T21:00:00Z"),
    });
    await missionLocaleEffectifsDb().insertMany(
      testDocs<IMissionLocaleEffectif>([recent, traite, softDeleted, limite])
    );

    const report = await clotureMlARecontacter({ dryRun: false });

    expect(report.dossiers).toBe(1);
    expect(report.parMissionLocale).toEqual({ [AUTRE_ML_ID.toString()]: 1 });
    const situations = await missionLocaleEffectifsDb()
      .find({ _id: { $in: [recent._id, traite._id, softDeleted._id, limite._id] } })
      .toArray();
    const byId = new Map(situations.map((e) => [e._id.toString(), e.situation]));
    expect(byId.get(recent._id.toString())).toBe(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
    expect(byId.get(traite._id.toString())).toBe(SITUATION_ENUM.RDV_PRIS);
    expect(byId.get(softDeleted._id.toString())).toBe(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
    expect(byId.get(limite._id.toString())).toBe(SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES);
    expect(createOrUpdateMissionLocaleStats).toHaveBeenCalledTimes(1);
  });

  it("date la clôture à la dernière action ML quand elle est postérieure à passage + 2 mois", async () => {
    const doc = createMlEffectifDoc({ date_derniere_action_ml: new Date("2026-07-01T08:00:00Z") });
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    await clotureMlARecontacter({ dryRun: false });

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.date_traitement).toEqual(new Date("2026-07-01T08:00:00Z"));
    const log = await missionLocaleEffectifsLogDb().findOne({ mission_locale_effectif_id: doc._id });
    expect(log?.created_at).toEqual(new Date("2026-07-01T08:00:00Z"));
    expect(log?.commentaires).toContain("depuis 76 jours");
  });

  it("isole l'échec du recalcul des stats d'une Mission Locale", async () => {
    vi.mocked(createOrUpdateMissionLocaleStats).mockRejectedValueOnce(new Error("boom"));
    await missionLocaleEffectifsDb().insertMany(
      testDocs<IMissionLocaleEffectif>([createMlEffectifDoc(), createMlEffectifDoc({ mission_locale_id: AUTRE_ML_ID })])
    );

    const report = await clotureMlARecontacter({ dryRun: false });

    expect(report.updated).toBe(2);
    expect(report.logsInserted).toBe(2);
    expect(report.statsEnErreur).toHaveLength(1);
    expect(createOrUpdateMissionLocaleStats).toHaveBeenCalledTimes(2);
  });

  it("n'écrit rien en dry-run", async () => {
    const doc = createMlEffectifDoc();
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    const report = await clotureMlARecontacter({ dryRun: true });

    expect(report.dossiers).toBe(1);
    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.situation).toBe(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
    expect(await missionLocaleEffectifsLogDb().countDocuments({ mission_locale_effectif_id: doc._id })).toBe(0);
    expect(createOrUpdateMissionLocaleStats).not.toHaveBeenCalled();
  });
});
