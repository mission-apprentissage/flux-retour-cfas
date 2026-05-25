import { ObjectId } from "mongodb";
import type { IOrganisation } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { generateMissionLocaleEffectifFixture as buildMlEffectif } from "shared/models/fixtures/missionLocaleEffectif.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { addDaysUTC } from "shared/utils/date";
import { describe, it, expect } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { computeStatsForDate, getCollaborationStats } from "./collaboration-stats.actions";

useMongo();

const HDF = "32";
const IDF = "11";
const REUNION = "04";

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

  it("counts compatibles and actives, ignores fermes, ventilates per region (including DROM)", async () => {
    const compatibleHdf = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    const compatibleIdf = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: IDF } as never,
    });
    const compatibleReunion = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: REUNION } as never,
    });
    const compatibleFerme = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      ferme: true,
      adresse: { region: HDF } as never,
    });
    const notCompatible = generateOrganismeFixture({
      _id: new ObjectId(),
      adresse: { region: HDF } as never,
    });

    await organismesDb().insertMany([compatibleHdf, compatibleIdf, compatibleReunion, compatibleFerme, notCompatible]);

    await organisationsDb().insertMany([
      orgFormationFixture(compatibleHdf._id, new Date("2025-12-01")), // pre-cutoff pilot still counts
      orgFormationFixture(compatibleIdf._id, null),
      orgFormationFixture(compatibleReunion._id, new Date("2026-02-15")),
    ]);

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
    const org = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertOne(org);
    await organisationsDb().insertOne(orgFormationFixture(org._id, new Date("2026-02-15")));

    const before = await computeStatsForDate(new Date("2026-02-10"));
    const after = await computeStatsForDate(new Date("2026-02-20"));

    expect(before.national.activation.cfa_actives).toBe(0);
    expect(after.national.activation.cfa_actives).toBe(1);
  });

  it("counts pre/post-cutoff effectifs correctly, excludes soft_deleted, restricts cfa_with_collab to compatibles", async () => {
    const compatibleOrg = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    const compatibleOrgNoEnvoi = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    const nonCompatibleOrg = generateOrganismeFixture({
      _id: new ObjectId(),
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertMany([compatibleOrg, compatibleOrgNoEnvoi, nonCompatibleOrg]);

    const preCutoff = new Date("2025-12-15");
    const postCutoff1 = new Date("2026-02-01");
    const postCutoff2 = new Date("2026-03-01");

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({ organisme_id: compatibleOrg._id, created_at: postCutoff1, reponse_at: postCutoff1 }),
        buildMlEffectif({
          organisme_id: compatibleOrg._id,
          created_at: postCutoff2,
          reponse_at: postCutoff2,
          situation: SITUATION_ENUM.RDV_PRIS,
        }),
        buildMlEffectif({ organisme_id: compatibleOrg._id, created_at: preCutoff, reponse_at: preCutoff }),
        buildMlEffectif({
          organisme_id: compatibleOrg._id,
          created_at: postCutoff1,
          reponse_at: postCutoff1,
          soft_deleted: true,
        }),
        buildMlEffectif({ organisme_id: compatibleOrgNoEnvoi._id, created_at: postCutoff1 }),
        buildMlEffectif({
          organisme_id: nonCompatibleOrg._id,
          created_at: postCutoff1,
          reponse_at: postCutoff1,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const stats = await computeStatsForDate(addDaysUTC(new Date("2026-05-25"), 1));

    expect(stats.national.usage.rupturants).toBe(4);
    expect(stats.national.usage.dossiers_envoyes_cfa).toBe(3);
    expect(stats.national.usage.dossiers_traites_ml).toBe(1);
    expect(stats.national.usage.jeunes_repondus).toBe(1);
    expect(stats.national.usage.rdv_pris).toBe(1);
    expect(stats.national.activation.cfa_with_collab).toBe(1);

    const hdf = stats.regions.find((r) => r.region_code === HDF);
    expect(hdf).toMatchObject({
      rupturants: 4,
      dossiers_envoyes_cfa: 3,
      cfa_with_collab: 1,
    });
  });

  it("falls back to effectif_snapshot._computed.organisme.region when organisme lookup misses", async () => {
    const ghostOrgId = new ObjectId();

    await missionLocaleEffectifsDb().insertMany(
      [
        buildMlEffectif({
          organisme_id: ghostOrgId,
          created_at: new Date("2026-02-01"),
          snapshot_region: IDF,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const stats = await computeStatsForDate(addDaysUTC(new Date("2026-05-25"), 1));

    expect(stats.national.usage.rupturants).toBe(1);
    const idf = stats.regions.find((r) => r.region_code === IDF);
    expect(idf).toMatchObject({ rupturants: 1, cfa_with_collab: 0 });
  });
});

describe("getCollaborationStats", () => {
  it("computes J vs J-7 variations — cfa_compatibles has no variation (no flag history)", async () => {
    const org = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertOne(org);
    await organisationsDb().insertOne(orgFormationFixture(org._id, new Date("2026-02-15")));

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
    const org = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertOne(org);

    await missionLocaleEffectifsDb().insertMany(
      [buildMlEffectif({ organisme_id: org._id, created_at: new Date("2026-05-22") })],
      { bypassDocumentValidation: true }
    );

    const response = await getCollaborationStats(new Date("2026-05-25"));

    expect(response.national.usage.rupturants).toEqual({ current: 1, variation: "" });
  });

  it("provides per-region deltas", async () => {
    const org = generateOrganismeFixture({
      _id: new ObjectId(),
      is_allowed_collab: true,
      adresse: { region: HDF } as never,
    });
    await organismesDb().insertOne(org);
    await organisationsDb().insertOne(orgFormationFixture(org._id, new Date("2026-04-01")));

    await missionLocaleEffectifsDb().insertMany(
      [
        // pre-J-7: 1 dossier envoyé
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-04-01"),
          reponse_at: new Date("2026-04-10"),
        }),
        // post-J-7: 2 dossiers envoyés
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-05-20"),
          reponse_at: new Date("2026-05-20"),
        }),
        buildMlEffectif({
          organisme_id: org._id,
          created_at: new Date("2026-05-22"),
          reponse_at: new Date("2026-05-22"),
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const response = await getCollaborationStats(new Date("2026-05-25"));
    const hdf = response.regions.find((r) => r.region_code === HDF);

    expect(hdf?.cfa_with_collab).toEqual({ current: 1, delta: 0 }); // same CFA, just more dossiers
    expect(hdf?.dossiers_envoyes_cfa).toBe(3);
  });
});
