import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import type { StatutApprenant } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { it, expect, describe, beforeEach } from "vitest";

import { effectifsDb, effectifsDECADb, missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { updateMissionLocaleEffectifCurrentStatus } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc, testDocs } from "@tests/utils/testUtils";

const ML_ID = new ObjectId();

const dayOffset = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

function createEffectifDoc(parcours: Array<{ valeur: StatutApprenant; date: Date }>, _id = new ObjectId()) {
  return { _id, _computed: { statut: { parcours } } };
}

function createMlEffectifDoc(
  effectifId: ObjectId,
  currentStatus: IMissionLocaleEffectif["current_status"] | null = null
) {
  return {
    _id: new ObjectId(),
    mission_locale_id: ML_ID,
    effectif_id: effectifId,
    created_at: new Date(),
    current_status: currentStatus ?? { value: STATUT_APPRENANT.RUPTURANT, date: dayOffset(-60) },
  };
}

describe("updateMissionLocaleEffectifCurrentStatus", () => {
  useMongo();

  beforeEach(async () => {
    await getDatabase().command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
    await getDatabase().command({ collMod: "effectifs", validationLevel: "off" });
    await getDatabase().command({ collMod: "effectifsDECA", validationLevel: "off" });

    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id: ML_ID,
        type: "MISSION_LOCALE",
        ml_id: 609,
        nom: "MA MISSION LOCALE",
        created_at: new Date(),
      })
    );
  });

  it("rafraîchit current_status depuis le parcours de l'effectif", async () => {
    const effectifId = new ObjectId();
    await effectifsDb().insertOne(
      testDoc<IEffectif>(
        createEffectifDoc(
          [
            { valeur: STATUT_APPRENANT.APPRENTI, date: dayOffset(-200) },
            { valeur: STATUT_APPRENANT.RUPTURANT, date: dayOffset(-60) },
            { valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: dayOffset(-5) },
          ],
          effectifId
        )
      )
    );
    await missionLocaleEffectifsDb().insertOne(testDoc<IMissionLocaleEffectif>(createMlEffectifDoc(effectifId)));

    const result = await updateMissionLocaleEffectifCurrentStatus();

    expect(result).toEqual({ aborted: false, nbEffectifsMisAJour: 1 });
    const doc = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(doc?.current_status?.value).toBe(STATUT_APPRENANT.FIN_DE_FORMATION);
  });

  it("n'écrit pas quand le statut est déjà à jour", async () => {
    const effectifId = new ObjectId();
    const dateRupture = dayOffset(-60);
    await effectifsDb().insertOne(
      testDoc<IEffectif>(createEffectifDoc([{ valeur: STATUT_APPRENANT.RUPTURANT, date: dateRupture }], effectifId))
    );
    await missionLocaleEffectifsDb().insertOne(
      testDoc<IMissionLocaleEffectif>(
        createMlEffectifDoc(effectifId, { value: STATUT_APPRENANT.RUPTURANT, date: dateRupture })
      )
    );

    const result = await updateMissionLocaleEffectifCurrentStatus();

    expect(result.nbEffectifsMisAJour).toBe(0);
  });

  // Un parcours entièrement à venir ne doit pas retomber sur sa dernière étape (FIN_DE_FORMATION),
  // ce qui masquerait un jeune dont la formation n'a pas commencé.
  it("retombe sur la première étape quand le parcours est entièrement à venir", async () => {
    const effectifId = new ObjectId();
    await effectifsDb().insertOne(
      testDoc<IEffectif>(
        createEffectifDoc(
          [
            { valeur: STATUT_APPRENANT.INSCRIT, date: dayOffset(30) },
            { valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: dayOffset(400) },
          ],
          effectifId
        )
      )
    );
    await missionLocaleEffectifsDb().insertOne(testDoc<IMissionLocaleEffectif>(createMlEffectifDoc(effectifId)));

    await updateMissionLocaleEffectifCurrentStatus();

    const doc = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(doc?.current_status?.value).toBe(STATUT_APPRENANT.INSCRIT);
  });

  it("donne la priorité à l'ERP sur DECA pour un même effectif_id", async () => {
    const effectifId = new ObjectId();
    await effectifsDb().insertOne(
      testDoc<IEffectif>(createEffectifDoc([{ valeur: STATUT_APPRENANT.RUPTURANT, date: dayOffset(-10) }], effectifId))
    );
    await effectifsDECADb().insertOne(
      testDoc<IEffectifDECA>(createEffectifDoc([{ valeur: STATUT_APPRENANT.ABANDON, date: dayOffset(-5) }], effectifId))
    );
    await missionLocaleEffectifsDb().insertOne(
      testDoc<IMissionLocaleEffectif>(
        createMlEffectifDoc(effectifId, { value: STATUT_APPRENANT.APPRENTI, date: dayOffset(-90) })
      )
    );

    await updateMissionLocaleEffectifCurrentStatus();

    const doc = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(doc?.current_status?.value).toBe(STATUT_APPRENANT.RUPTURANT);
  });

  it("traite les dossiers au-delà d'un batch", async () => {
    const docs = Array.from({ length: 1200 }, () => {
      const effectifId = new ObjectId();
      return {
        effectif: createEffectifDoc([{ valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: dayOffset(-1) }], effectifId),
        ml: createMlEffectifDoc(effectifId),
      };
    });
    await effectifsDb().insertMany(testDocs<IEffectif>(docs.map((d) => d.effectif)));
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>(docs.map((d) => d.ml)));

    const result = await updateMissionLocaleEffectifCurrentStatus();

    expect(result.nbEffectifsMisAJour).toBe(1200);
    expect(
      await missionLocaleEffectifsDb().countDocuments({ "current_status.value": STATUT_APPRENANT.FIN_DE_FORMATION })
    ).toBe(1200);
  });
});
