import { ObjectId } from "bson";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it } from "vitest";

import { missionLocaleEffectifsDb, missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getCollaborationSegmentStats } from "./mission-locale-stats.actions";
import { buildEmptySegments, EMPTY_COLLAB_SEGMENT_STATS } from "./mission-locale-stats.helpers";

useMongo();

const ML_IDF = new ObjectId();
const ML_ARA = new ObjectId();
const CFA_A = new ObjectId();
const CFA_B = new ObjectId();
const CFA_C = new ObjectId();

const today = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n: number) => {
  const d = today();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

const insertStats = async (
  missionLocaleId: ObjectId,
  computedDay: Date,
  collab: Partial<typeof EMPTY_COLLAB_SEGMENT_STATS>
) => {
  await missionLocaleStatsDb().insertOne(
    {
      _id: new ObjectId(),
      mission_locale_id: missionLocaleId,
      computed_day: computedDay,
      created_at: new Date(),
      updated_at: new Date(),
      stats: { total: 0, a_traiter: 0, traite: 0 },
      segments: { ...buildEmptySegments(), collab: { ...EMPTY_COLLAB_SEGMENT_STATS, ...collab } },
    } as never,
    { bypassDocumentValidation: true }
  );
};

const insertCollab = async (
  missionLocaleId: ObjectId,
  organismeId: ObjectId,
  { accConjointAt = daysAgo(5), motif = [] as string[], softDeleted = false } = {}
) => {
  await missionLocaleEffectifsDb().insertOne(
    {
      _id: new ObjectId(),
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(),
      created_at: daysAgo(40),
      effectif_snapshot: { organisme_id: organismeId },
      organisme_data: { acc_conjoint: true, acc_conjoint_at: accConjointAt, has_unread_notification: false, motif },
      ...(softDeleted ? { soft_deleted: true } : {}),
    } as unknown as IMissionLocaleEffectif,
    { bypassDocumentValidation: true }
  );
};

describe("getCollaborationSegmentStats", () => {
  beforeEach(async () => {
    const base = { type: "MISSION_LOCALE", created_at: new Date(), activated_at: daysAgo(200) };
    await organisationsDb().insertMany(
      [
        { _id: ML_IDF, ...base, ml_id: 801, nom: "ML IDF", adresse: { region: "11" } },
        { _id: ML_ARA, ...base, ml_id: 802, nom: "ML ARA", adresse: { region: "84" } },
      ] as IOrganisation[],
      { bypassDocumentValidation: true }
    );
  });

  it("renvoie un bloc vide sans données", async () => {
    const stats = await getCollaborationSegmentStats("30days");

    expect(stats).toMatchObject({
      cfa_ayant_collabore: { current: 0 },
      jeunes_envoyes: { current: 0 },
      part_deja_connus: 0,
      delai_moyen_jours: null,
      situations: { total: 0 },
      objectifs: { total_dossiers: 0 },
    });
  });

  it("agrège les segments collab des ML, la part de déjà connus et le délai moyen pondéré", async () => {
    await insertStats(ML_IDF, today(), {
      total: 10,
      a_traiter: 2,
      traite: 8,
      rdv_pris: 4,
      deja_connu_accompagne: 2,
      situation_rupture: 7,
      situation_prevention_modere: 3,
      delai_premiere_activite_jours_total: 20,
      delai_premiere_activite_count: 4,
    });
    await insertStats(ML_ARA, today(), {
      total: 5,
      a_traiter: 1,
      traite: 4,
      rdv_pris: 1,
      deja_connu_accompagne: 4,
      situation_abandon: 5,
      delai_premiere_activite_jours_total: 4,
      delai_premiere_activite_count: 2,
    });
    await insertStats(ML_IDF, daysAgo(30), { total: 6, traite: 3, rdv_pris: 2 });

    const stats = await getCollaborationSegmentStats("30days");

    expect(stats.jeunes_envoyes).toEqual({ current: 15, variation: "+60%" });
    expect(stats.jeunes_contactes.current).toBe(12);
    expect(stats.jeunes_accompagnement_accepte).toEqual({ current: 5, variation: "+60%" });
    expect(stats.part_deja_connus).toBe(50);
    expect(stats.delai_moyen_jours).toBe(4);
    expect(stats.situations).toEqual({
      rupture: 7,
      abandon: 5,
      prevention_inevitable: 0,
      prevention_tres_eleve: 0,
      prevention_modere: 3,
      besoin_aide_hors_rupture: 0,
      total: 15,
    });
    expect(stats.resultats.rdv_pris.current).toBe(5);
    expect(stats.resultats.total).toBe(12);
  });

  it("compte les CFA distincts dans la région de la ML destinataire, à la date d'envoi, hors soft-deleted", async () => {
    await insertCollab(ML_IDF, CFA_A, { motif: ["MOBILITE", "SANTE"] });
    await insertCollab(ML_IDF, CFA_A, { motif: ["MOBILITE"] });
    await insertCollab(ML_IDF, CFA_B, { accConjointAt: daysAgo(45) });
    await insertCollab(ML_ARA, CFA_C, { motif: ["AUTRE"] });
    await insertCollab(ML_ARA, CFA_B, { softDeleted: true });

    const national = await getCollaborationSegmentStats("30days");
    expect(national.cfa_ayant_collabore).toEqual({ current: 3, variation: "+67%" });
    expect(national.objectifs).toMatchObject({ mobilite: 2, sante: 1, autre: 1, total_dossiers: 4 });

    const idf = await getCollaborationSegmentStats("30days", ["11"]);
    expect(idf.cfa_ayant_collabore.current).toBe(2);
    expect(idf.objectifs.total_dossiers).toBe(3);

    const ara = await getCollaborationSegmentStats("30days", undefined, ML_ARA.toString());
    expect(ara.cfa_ayant_collabore.current).toBe(1);
    expect(ara.objectifs).toMatchObject({ autre: 1, mobilite: 0, total_dossiers: 1 });
  });
});
