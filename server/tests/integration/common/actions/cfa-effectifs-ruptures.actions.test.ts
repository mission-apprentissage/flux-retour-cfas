import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationOrganismeFormation } from "shared/models";
import { getAnneeScolaireListFromDateRange } from "shared/utils";
import { v4 as uuidv4 } from "uuid";
import { describe, it, beforeEach, expect } from "vitest";

import { getCfaEffectifsEnRupture } from "@/common/actions/cfa/cfa-effectifs-ruptures.actions";
import { DATE_START_RUPTURES } from "@/common/actions/shared/rupture-pipeline.utils";
import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const DAY = 24 * 60 * 60 * 1000;

const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const anneeScolaire = getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date())[0];

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

const organisation: IOrganisationOrganismeFormation = {
  _id: new ObjectId(id(10)),
  type: "ORGANISME_FORMATION",
  siret: "19040492100016",
  uai: null,
  organisme_id: organismeId.toString(),
  created_at: new Date(),
};

async function createMlEffectif(overrides: Record<string, any> = {}) {
  const now = new Date();
  const dateRupture = overrides.date_rupture ?? new Date(now.getTime() - 20 * DAY);

  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: anneeScolaire,
    apprenant: {
      date_de_naissance: new Date(now.getFullYear() - 20, 0, 1),
      ...overrides.apprenant,
    },
    ...overrides._computed_override,
  });

  return {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: new ObjectId(),
    effectif_snapshot: {
      ...snapshot,
      _id: new ObjectId(),
      organisme_id: organismeId,
      _computed: overrides.statut_en_cours
        ? { ...snapshot._computed, statut: { ...snapshot._computed?.statut, en_cours: overrides.statut_en_cours } }
        : { ...snapshot._computed, statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT } },
    },
    effectif_snapshot_date: now,
    date_rupture: dateRupture,
    current_status: overrides.current_status ?? {
      value: STATUT_APPRENANT.RUPTURANT,
      date: dateRupture,
    },
    created_at: now,
    brevo: { token: uuidv4(), token_created_at: now },
    ...(overrides.cfa_rupture_declaration ? { cfa_rupture_declaration: overrides.cfa_rupture_declaration } : {}),
    ...(overrides.soft_deleted ? { soft_deleted: true } : {}),
  };
}

describe("getCfaEffectifsEnRupture", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("retourne les 3 segments même vides", async () => {
    const result = await getCfaEffectifsEnRupture(organisation, true);

    expect(result).toHaveLength(3);
    expect(result.map((s) => s.segment)).toEqual(["moins_45j", "46_90j", "91_180j"]);
    expect(result.every((s) => s.count === 0)).toBe(true);
  });

  it("segmente les ruptures par durée", async () => {
    const now = new Date();
    const docs = await Promise.all([
      createMlEffectif({ date_rupture: new Date(now.getTime() - 10 * DAY) }),
      createMlEffectif({ date_rupture: new Date(now.getTime() - 60 * DAY) }),
      createMlEffectif({ date_rupture: new Date(now.getTime() - 120 * DAY) }),
    ]);
    await missionLocaleEffectifsDb().insertMany(docs as any[]);

    const result = await getCfaEffectifsEnRupture(organisation, true);

    expect(result.find((s) => s.segment === "moins_45j")?.count).toBe(1);
    expect(result.find((s) => s.segment === "46_90j")?.count).toBe(1);
    expect(result.find((s) => s.segment === "91_180j")?.count).toBe(1);
  });

  it("exclut les ruptures de plus de 180 jours", async () => {
    const now = new Date();
    const doc = await createMlEffectif({ date_rupture: new Date(now.getTime() - 200 * DAY) });
    await missionLocaleEffectifsDb().insertOne(doc as any);

    const result = await getCfaEffectifsEnRupture(organisation, true);

    const totalCount = result.reduce((sum, s) => sum + s.count, 0);
    expect(totalCount).toBe(0);
  });

  it("inclut les déclarations manuelles CFA", async () => {
    const now = new Date();
    const dateRupture = new Date(now.getTime() - 15 * DAY);

    const doc = await createMlEffectif({
      date_rupture: dateRupture,
      statut_en_cours: STATUT_APPRENANT.APPRENTI,
      current_status: { value: STATUT_APPRENANT.APPRENTI, date: now },
      cfa_rupture_declaration: {
        date_rupture: dateRupture,
        declared_at: now,
        declared_by: new ObjectId(),
      },
    });
    await missionLocaleEffectifsDb().insertOne(doc as any);

    const result = await getCfaEffectifsEnRupture(organisation, true);

    const totalCount = result.reduce((sum, s) => sum + s.count, 0);
    expect(totalCount).toBe(1);
  });

  it("n'exclut pas les APPRENTI quand cfa_rupture_declaration existe", async () => {
    const now = new Date();
    const dateRupture = new Date(now.getTime() - 30 * DAY);

    const docs = await Promise.all([
      createMlEffectif({
        date_rupture: dateRupture,
        statut_en_cours: STATUT_APPRENANT.APPRENTI,
        current_status: { value: STATUT_APPRENANT.APPRENTI, date: now },
        cfa_rupture_declaration: {
          date_rupture: dateRupture,
          declared_at: now,
          declared_by: new ObjectId(),
        },
      }),
      createMlEffectif({
        date_rupture: dateRupture,
        current_status: { value: STATUT_APPRENANT.APPRENTI, date: now },
      }),
    ]);
    await missionLocaleEffectifsDb().insertMany(docs as any[]);

    const result = await getCfaEffectifsEnRupture(organisation, true);

    const totalCount = result.reduce((sum, s) => sum + s.count, 0);
    expect(totalCount).toBe(1);
  });

  it("exclut les effectifs soft_deleted", async () => {
    const doc = await createMlEffectif({ soft_deleted: true });
    await missionLocaleEffectifsDb().insertOne(doc as any);

    const result = await getCfaEffectifsEnRupture(organisation, true);

    const totalCount = result.reduce((sum, s) => sum + s.count, 0);
    expect(totalCount).toBe(0);
  });
});
