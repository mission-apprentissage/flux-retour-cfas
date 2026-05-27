import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import type { IOrganisation, IOrganisme } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { generateMissionLocaleEffectifFixture } from "shared/models/fixtures/missionLocaleEffectif.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { addDaysUTC, getAnneeScolaireFromDate } from "shared/utils";
import { describe, it, expect } from "vitest";

import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { computeStatsForDate, getCollaborationStats } from "./collaboration-stats.actions";

useMongo();

const HDF = "32";
const IDF = "11";
const REUNION = "04";

const CURRENT_ANNEE = getAnneeScolaireFromDate(new Date());
const buildMlEffectif = generateMissionLocaleEffectifFixture;

let uaiCounter = 0;
const nextUai = () => `010000${(uaiCounter++).toString().padStart(2, "0")}A`;

function buildCompatibleOrganisme(overrides: Partial<IOrganisme> = {}): IOrganisme {
  return generateOrganismeFixture({
    _id: new ObjectId(),
    uai: nextUai(),
    nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    ...overrides,
  });
}

async function insertActiveEffectif(organismeId: ObjectId) {
  await effectifsDb().insertOne(
    { _id: new ObjectId(), organisme_id: organismeId, annee_scolaire: CURRENT_ANNEE } as never,
    { bypassDocumentValidation: true }
  );
}

const DEFAULT_ACTIVATED_AT = new Date("2025-12-01");

async function insertCompatible(
  overrides: Partial<IOrganisme> = {},
  options: { activatedAt?: Date | null } = {}
): Promise<IOrganisme> {
  const org = buildCompatibleOrganisme(overrides);
  await organismesDb().insertOne(org, { bypassDocumentValidation: true });
  await insertActiveEffectif(org._id as ObjectId);
  const activatedAt = options.activatedAt === undefined ? DEFAULT_ACTIVATED_AT : options.activatedAt;
  if (activatedAt !== null) {
    await organisationsDb().insertOne(orgFormationFixture(org._id as ObjectId, activatedAt));
  }
  return org;
}

const orgFormationFixture = (organismeId: ObjectId, activatedAt: Date | null): IOrganisation =>
  ({
    _id: new ObjectId(),
    type: "ORGANISME_FORMATION",
    created_at: new Date(),
    siret: "00000000000000",
    uai: null,
    organisme_id: organismeId.toString(),
    ...(activatedAt ? { ml_beta_activated_at: activatedAt } : {}),
  }) as IOrganisation;

describe("computeStatsForDate", () => {
  it("returns zeros for everything when no data", async () => {
    const stats = await computeStatsForDate(new Date("2026-05-26"));
    expect(stats.national.activation).toEqual({ cfa_compatibles: 0, cfa_actives: 0, cfa_with_collab: 0 });
    expect(stats.national.usage).toEqual({
      rupturants: 0,
      dossiers_envoyes_cfa: 0,
      dossiers_traites_ml: 0,
      jeunes_repondus: 0,
      rdv_pris: 0,
    });
    expect(stats.regions).toEqual([]);
  });

  it("counts compatibles and actives, ignores fermes/ineligibles, ventilates per region (including DROM)", async () => {
    await insertCompatible(
      { adresse: { region: HDF } as never },
      { activatedAt: new Date("2025-12-01") } // pre-cutoff pilot still counts
    );
    await insertCompatible({ adresse: { region: IDF } as never }, { activatedAt: null });
    await insertCompatible({ adresse: { region: REUNION } as never }, { activatedAt: new Date("2026-02-15") });
    await insertCompatible({ ferme: true, adresse: { region: HDF } as never }, { activatedAt: null });
    await insertCompatible(
      { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE, adresse: { region: HDF } as never },
      { activatedAt: null }
    );
    const noEffectifOrg = buildCompatibleOrganisme({ adresse: { region: HDF } as never });
    await organismesDb().insertOne(noEffectifOrg, { bypassDocumentValidation: true });

    const stats = await computeStatsForDate(new Date("2026-05-26"));

    expect(stats.national.activation.cfa_compatibles).toBe(3);
    expect(stats.national.activation.cfa_actives).toBe(2);

    const hdf = stats.regions.find((r) => r.region_code === HDF);
    const idf = stats.regions.find((r) => r.region_code === IDF);
    const reunion = stats.regions.find((r) => r.region_code === REUNION);

    expect(hdf).toMatchObject({ cfa_compatibles: 1, cfa_actives: 1 });
    expect(idf).toMatchObject({ cfa_compatibles: 1, cfa_actives: 0 });
    expect(reunion).toMatchObject({ cfa_compatibles: 1, cfa_actives: 1 });
  });

  it("activation count respects endExclusive — pilot activated after cutoff excluded for J-7 view", async () => {
    await insertCompatible({ adresse: { region: HDF } as never }, { activatedAt: new Date("2026-02-15") });

    const before = await computeStatsForDate(new Date("2026-02-10"));
    const after = await computeStatsForDate(new Date("2026-02-20"));

    expect(before.national.activation.cfa_actives).toBe(0);
    expect(after.national.activation.cfa_actives).toBe(1);
  });

  it("counts pre/post-cutoff effectifs correctly, excludes soft_deleted, restricts cfa_with_collab to compatibles", async () => {
    const compatibleOrg = await insertCompatible({ adresse: { region: HDF } as never });
    const compatibleOrgNoEnvoi = await insertCompatible({ adresse: { region: HDF } as never });
    const nonCompatibleOrg = generateOrganismeFixture({
      _id: new ObjectId(),
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertOne(nonCompatibleOrg, { bypassDocumentValidation: true });

    const preCutoff = new Date("2025-12-15");
    const postCutoff1 = new Date("2026-02-01");
    const postCutoff2 = new Date("2026-03-01");

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({
          organisme_id: compatibleOrg._id,
          created_at: postCutoff1,
          reponse_at: postCutoff1,
          acc_conjoint: true,
        }),
        buildMlEffectif({
          organisme_id: compatibleOrg._id,
          created_at: postCutoff2,
          reponse_at: postCutoff2,
          acc_conjoint: true,
          situation: SITUATION_ENUM.RDV_PRIS,
        }),
        buildMlEffectif({
          organisme_id: compatibleOrg._id,
          created_at: preCutoff,
          reponse_at: preCutoff,
          acc_conjoint: true,
        }),
        buildMlEffectif({
          organisme_id: compatibleOrg._id,
          created_at: postCutoff1,
          reponse_at: postCutoff1,
          acc_conjoint: true,
          soft_deleted: true,
        }),
        buildMlEffectif({ organisme_id: compatibleOrgNoEnvoi._id, created_at: postCutoff1 }),
        buildMlEffectif({
          organisme_id: nonCompatibleOrg._id,
          created_at: postCutoff1,
          reponse_at: postCutoff1,
          acc_conjoint: true,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const stats = await computeStatsForDate(addDaysUTC(new Date("2026-05-25"), 1));

    expect(stats.national.usage.rupturants).toBe(3);
    expect(stats.national.usage.dossiers_envoyes_cfa).toBe(2);
    expect(stats.national.usage.dossiers_traites_ml).toBe(1);
    expect(stats.national.usage.jeunes_repondus).toBe(1);
    expect(stats.national.usage.rdv_pris).toBe(1);
    expect(stats.national.activation.cfa_with_collab).toBe(1);

    const hdf = stats.regions.find((r) => r.region_code === HDF);
    expect(hdf).toMatchObject({
      rupturants: 3,
      dossiers_envoyes_cfa: 2,
      cfa_with_collab: 1,
    });
  });

  it("repondu/rdv require dossier envoyé (reponse_at), not just a rupturant with a situation", async () => {
    const org = await insertCompatible({ adresse: { region: HDF } as never });

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-03-01"),
          situation: SITUATION_ENUM.RDV_PRIS,
        }),
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-03-10"),
          reponse_at: new Date("2026-03-11"),
          acc_conjoint: true,
          situation: SITUATION_ENUM.RDV_PRIS,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const stats = await computeStatsForDate(addDaysUTC(new Date("2026-05-25"), 1));

    expect(stats.national.usage.rupturants).toBe(2);
    expect(stats.national.usage.dossiers_envoyes_cfa).toBe(1);
    expect(stats.national.usage.dossiers_traites_ml).toBe(1);
    expect(stats.national.usage.jeunes_repondus).toBe(1);
    expect(stats.national.usage.rdv_pris).toBe(1);
  });

  it("dossiers_traites ignores ml-effectifs with situation field missing (BSON undefined ≠ null)", async () => {
    const org = await insertCompatible({ adresse: { region: HDF } as never });

    const withNull = buildMlEffectif({
      organisme_id: org._id,
      created_at: new Date("2026-03-03"),
      reponse_at: new Date("2026-03-04"),
      acc_conjoint: true,
      situation: null,
    });
    const withMissing = buildMlEffectif({
      organisme_id: org._id,
      created_at: new Date("2026-03-01"),
      reponse_at: new Date("2026-03-02"),
      acc_conjoint: true,
    });
    delete (withMissing as { situation?: unknown }).situation;
    const withSituation = buildMlEffectif({
      organisme_id: org._id,
      created_at: new Date("2026-03-05"),
      reponse_at: new Date("2026-03-06"),
      acc_conjoint: true,
      situation: SITUATION_ENUM.AUTRE,
    });

    await missionLocaleEffectifsDb().insertMany([withMissing, withNull, withSituation], {
      bypassDocumentValidation: true,
    });

    const stats = await computeStatsForDate(addDaysUTC(new Date("2026-05-25"), 1));

    expect(stats.national.usage.dossiers_envoyes_cfa).toBe(3);
    expect(stats.national.usage.dossiers_traites_ml).toBe(1);
  });

  it("excludes effectifs from non-compatible CFAs (regardless of activation flag)", async () => {
    const compatible = await insertCompatible({ adresse: { region: HDF } as never });

    const nonCompatibleOrg = generateOrganismeFixture({
      _id: new ObjectId(),
      uai: nextUai(),
      nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertOne(nonCompatibleOrg, { bypassDocumentValidation: true });

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({
          organisme_id: compatible._id,
          created_at: new Date("2026-02-01"),
          reponse_at: new Date("2026-02-02"),
          acc_conjoint: true,
        }),
        buildMlEffectif({
          organisme_id: nonCompatibleOrg._id,
          created_at: new Date("2026-02-01"),
          reponse_at: new Date("2026-02-02"),
          acc_conjoint: true,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const stats = await computeStatsForDate(addDaysUTC(new Date("2026-05-25"), 1));

    expect(stats.national.usage.rupturants).toBe(1);
    expect(stats.national.usage.dossiers_envoyes_cfa).toBe(1);
  });
});

describe("getCollaborationStats", () => {
  it("computes J vs J-7 variations — cfa_compatibles has no variation (no flag history)", async () => {
    const org = await insertCompatible({ adresse: { region: HDF } as never });
    await organisationsDb().insertOne(orgFormationFixture(org._id as ObjectId, new Date("2026-02-15")));

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-04-01") }),
        buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-04-15") }),
        buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-05-20") }),
        buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-05-21") }),
        buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-05-22") }),
      ],
      { bypassDocumentValidation: true }
    );

    const response = await getCollaborationStats(new Date("2026-05-25"));

    expect(response.cutoff_date).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    expect(response.national.activation.cfa_compatibles).toEqual({ current: 1, variation: "" });
    expect(response.national.activation.cfa_actives).toEqual({ current: 1, variation: "0%" });
    expect(response.national.usage.rupturants).toEqual({ current: 5, variation: "+150%" });
  });

  it("returns empty variation when J-7 baseline is 0", async () => {
    const org = await insertCompatible({ adresse: { region: HDF } as never });

    await missionLocaleEffectifsDb().insertMany(
      [buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-05-22") })],
      { bypassDocumentValidation: true }
    );

    const response = await getCollaborationStats(new Date("2026-05-25"));

    expect(response.national.usage.rupturants).toEqual({ current: 1, variation: "" });
  });

  it("provides per-region deltas", async () => {
    const org = await insertCompatible({ adresse: { region: HDF } as never });
    await organisationsDb().insertOne(orgFormationFixture(org._id as ObjectId, new Date("2026-04-01")));

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-04-01"),
          reponse_at: new Date("2026-04-10"),
          acc_conjoint: true,
        }),
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-05-20"),
          reponse_at: new Date("2026-05-20"),
          acc_conjoint: true,
        }),
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-05-22"),
          reponse_at: new Date("2026-05-22"),
          acc_conjoint: true,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const response = await getCollaborationStats(new Date("2026-05-25"));
    const hdf = response.regions.find((r) => r.region_code === HDF);

    expect(hdf?.cfa_with_collab).toEqual({ current: 1, delta: 0 });
    expect(hdf?.dossiers_envoyes_cfa).toBe(3);
  });
});
