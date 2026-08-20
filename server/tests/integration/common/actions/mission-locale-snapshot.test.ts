import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { RQTH_DECLARE_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import { updateOrDeleteMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const effectifId = new ObjectId(id(4));

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

async function buildEffectif(overrides: Record<string, any> = {}) {
  const effectif = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "SNAPSHOT",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
      rqth: false,
      ...overrides.apprenant,
    },
  });

  return {
    ...effectif,
    _id: effectifId,
    organisme_id: organismeId,
    _computed: {
      ...effectif._computed,
      statut: {
        en_cours: STATUT_APPRENANT.INSCRIT,
        parcours: [{ valeur: STATUT_APPRENANT.INSCRIT, date: new Date("2026-01-01") }],
      },
    },
  } as any;
}

async function insertMlRecord(overrides: Record<string, any> = {}) {
  const snapshot = await buildEffectif();
  const doc = {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: effectifId,
    effectif_snapshot: snapshot,
    effectif_snapshot_date: new Date(),
    date_rupture: null,
    created_at: new Date(),
    current_status: { value: null, date: null },
    ...overrides,
  };
  await missionLocaleEffectifsDb().insertOne(doc as any);
  return doc;
}

describe("updateOrDeleteMissionLocaleSnapshot", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("conserve un dossier de collaboration sans rupture ni déclaration CFA", async () => {
    await insertMlRecord({ organisme_data: { acc_conjoint: true, reponse_at: new Date() } });

    await updateOrDeleteMissionLocaleSnapshot(await buildEffectif());

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(updated?.soft_deleted).toBeFalsy();
    expect(updated?.date_rupture).toBeNull();
  });

  it("conserve un dossier dont le jeune souhaite un rendez-vous", async () => {
    await insertMlRecord({ souhaite_rdv: true });

    await updateOrDeleteMissionLocaleSnapshot(await buildEffectif());

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(updated?.soft_deleted).toBeFalsy();
  });

  it("soft-delete un dossier sans rupture, sans déclaration CFA et sans collaboration", async () => {
    await insertMlRecord({ organisme_data: { acc_conjoint: false } });

    await updateOrDeleteMissionLocaleSnapshot(await buildEffectif());

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(updated?.soft_deleted).toBe(true);
  });

  describe("RQTH déclaré par le CFA", () => {
    it("ré-applique rqth=true après réécriture du snapshot", async () => {
      await insertMlRecord({
        organisme_data: { acc_conjoint: true, verified_info: { rqth_declare: RQTH_DECLARE_ENUM.OUI } },
      });

      await updateOrDeleteMissionLocaleSnapshot(await buildEffectif({ apprenant: { rqth: false } }));

      const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(updated?.effectif_snapshot?.apprenant?.rqth).toBe(true);
    });

    it("ré-applique rqth=false même si l'ERP déclare true", async () => {
      await insertMlRecord({
        organisme_data: { acc_conjoint: true, verified_info: { rqth_declare: RQTH_DECLARE_ENUM.NON } },
      });

      await updateOrDeleteMissionLocaleSnapshot(await buildEffectif({ apprenant: { rqth: true } }));

      const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(updated?.effectif_snapshot?.apprenant?.rqth).toBe(false);
    });

    it("laisse la valeur de l'ERP quand le CFA n'a rien déclaré", async () => {
      await insertMlRecord({
        organisme_data: { acc_conjoint: true, verified_info: { rqth_declare: RQTH_DECLARE_ENUM.NON_RENSEIGNE } },
      });

      await updateOrDeleteMissionLocaleSnapshot(await buildEffectif({ apprenant: { rqth: true } }));

      const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(updated?.effectif_snapshot?.apprenant?.rqth).toBe(true);
    });
  });
});
