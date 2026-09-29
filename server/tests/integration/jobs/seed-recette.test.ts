import { ObjectId } from "bson";
import { subDays, subYears } from "date-fns";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IMissionLocaleCfaInvitation } from "shared/models/data/missionLocaleCfaInvitations.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { beforeEach, describe, expect, it } from "vitest";

import {
  effectifsDb,
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { CFA_HOST_CODES, type SeedRecetteHosts } from "@/jobs/seed-recette/hosts";
import { seedId } from "@/jobs/seed-recette/seed-ids";
import { assertSeedRecetteEnv, seedRecette } from "@/jobs/seed-recette/seed-recette";
import { useMongo } from "@tests/jest/setupMongo";
import { testDocs } from "@tests/utils/testUtils";

const COLLECTIONS = [
  "organisations",
  "organismes",
  "effectifs",
  "effectifsDECA",
  "missionLocaleEffectif",
  "missionLocaleEffectifLog",
  "missionLocaleCfaInvitations",
  "usersMigration",
];

const buildHosts = (): SeedRecetteHosts => ({
  missionsLocales: { ML_A: new ObjectId(), ML_B: new ObjectId() },
  cfas: Object.fromEntries(
    CFA_HOST_CODES.map((code) => [code, { organisationId: new ObjectId(), organismeId: new ObjectId() }])
  ) as SeedRecetteHosts["cfas"],
});

async function insertHosts(hosts: SeedRecetteHosts) {
  await organisationsDb().insertMany(
    testDocs<IOrganisation>([
      { _id: hosts.missionsLocales.ML_A, type: "MISSION_LOCALE", nom: "ML A", ml_id: 1, activated_at: new Date() },
      { _id: hosts.missionsLocales.ML_B, type: "MISSION_LOCALE", nom: "ML B", ml_id: 2 },
      ...Object.values(hosts.cfas).map(({ organisationId, organismeId }) => ({
        _id: organisationId,
        type: "ORGANISME_FORMATION" as const,
        siret: "12345678901234",
        uai: "0751234A",
        organisme_id: organismeId.toString(),
        ml_beta_activated_at: new Date(),
      })),
    ])
  );
  await organismesDb().insertMany(
    testDocs<IOrganisme>(
      Object.values(hosts.cfas).map(({ organismeId }) => ({
        _id: organismeId,
        siret: "12345678901234",
        is_allowed_collab: true,
        collab_suspended_at: new Date(),
      }))
    )
  );
}

describe("seedRecette", () => {
  useMongo();

  let hosts: SeedRecetteHosts;

  beforeEach(async () => {
    for (const collection of COLLECTIONS) {
      await getDatabase().command({ collMod: collection, validationLevel: "off" });
    }
    hosts = buildHosts();
    await insertHosts(hosts);
  });

  describe("assertSeedRecetteEnv", () => {
    it.each(["recette", "local", "test"])("accepte %s", (env) => {
      expect(() => assertSeedRecetteEnv(env)).not.toThrow();
    });

    it.each(["production", "preprod", "preview"])("refuse %s", (env) => {
      expect(() => assertSeedRecetteEnv(env)).toThrow(/refusé/);
    });

    it("n'écrit rien en production", async () => {
      await effectifsDb().insertOne(testDocs<IEffectif>([{ _id: seedId("effectif", 1) }])[0]);

      await expect(seedRecette({ hosts, env: "production" })).rejects.toThrow(/refusé/);

      expect(await effectifsDb().countDocuments()).toBe(1);
    });
  });

  it("échoue si un hôte est introuvable", async () => {
    await organisationsDb().deleteOne({ _id: hosts.cfas.CFA_OFF.organisationId });

    await expect(seedRecette({ hosts })).rejects.toThrow(/CFA_OFF/);
  });

  it("annule sans rien purger si un hôte a une activité réelle", async () => {
    await effectifsDb().insertMany(
      testDocs<IEffectif>([
        { _id: seedId("effectif", 1) },
        { _id: new ObjectId(), organisme_id: hosts.cfas.CFA_ON.organismeId },
      ])
    );

    await expect(seedRecette({ hosts })).rejects.toThrow(/activité réelle/);

    expect(await effectifsDb().countDocuments()).toBe(2);
  });

  it("annule si la ML hôte a un dossier réel, mais pas pour un dossier créé sur un effectif fictif", async () => {
    await missionLocaleEffectifsDb().insertOne(
      testDocs<IMissionLocaleEffectif>([
        { _id: new ObjectId(), mission_locale_id: hosts.missionsLocales.ML_A, effectif_id: seedId("effectif", 2) },
      ])[0]
    );
    await expect(seedRecette({ hosts })).resolves.toBeDefined();

    await missionLocaleEffectifsDb().insertOne(
      testDocs<IMissionLocaleEffectif>([
        { _id: new ObjectId(), mission_locale_id: hosts.missionsLocales.ML_A, effectif_id: new ObjectId() },
      ])[0]
    );
    await expect(seedRecette({ hosts })).rejects.toThrow(/activité réelle/);
  });

  it("purge le jeu fictif et ce qui s'y rattache, sans toucher au reste (désinstallation)", async () => {
    const reel = { effectif: new ObjectId(), dossier: new ObjectId(), log: new ObjectId(), user: new ObjectId() };
    const dossierTesteur = new ObjectId();
    const dossierAutreMl = new ObjectId();
    const logTesteur = new ObjectId();

    await effectifsDb().insertMany(testDocs<IEffectif>([{ _id: seedId("effectif", 1) }, { _id: reel.effectif }]));
    await missionLocaleEffectifsDb().insertMany(
      testDocs<IMissionLocaleEffectif>([
        {
          _id: seedId("effectif", 2),
          mission_locale_id: hosts.missionsLocales.ML_A,
          effectif_id: seedId("effectif", 1),
        },
        { _id: dossierTesteur, mission_locale_id: hosts.missionsLocales.ML_A, effectif_id: seedId("effectif", 3) },
        { _id: reel.dossier, mission_locale_id: new ObjectId(), effectif_id: reel.effectif },
        { _id: dossierAutreMl, mission_locale_id: new ObjectId(), effectif_id: seedId("effectif", 4) },
      ])
    );
    await missionLocaleEffectifsLogDb().insertMany(
      testDocs<IMissionLocaleEffectifLog>([
        { _id: seedId("effectif", 4), mission_locale_effectif_id: seedId("effectif", 2) },
        { _id: logTesteur, mission_locale_effectif_id: dossierTesteur },
        { _id: reel.log, mission_locale_effectif_id: reel.dossier },
      ])
    );
    const invitationReelle = new ObjectId();
    await missionLocaleCfaInvitationsDb().insertMany(
      testDocs<IMissionLocaleCfaInvitation>([
        { _id: new ObjectId(), mission_locale_id: hosts.missionsLocales.ML_A, author_id: seedId("user", 1) },
        { _id: invitationReelle, mission_locale_id: hosts.missionsLocales.ML_A, author_id: new ObjectId() },
      ])
    );
    await usersMigrationDb().insertMany(
      testDocs<IUsersMigration>([
        { _id: seedId("effectif", 5), organisation_id: hosts.missionsLocales.ML_A },
        { _id: reel.user, organisation_id: new ObjectId() },
      ])
    );

    const report = await seedRecette({ hosts, uninstall: true });

    expect(report.purge).toEqual({
      effectifs: 1,
      effectifsDECA: 0,
      missionLocaleEffectif: 2,
      missionLocaleEffectifLog: 2,
      missionLocaleCfaInvitations: 1,
      usersMigration: 1,
    });
    expect(await effectifsDb().distinct("_id")).toEqual([reel.effectif]);
    expect((await missionLocaleEffectifsDb().distinct("_id")).map(String).sort()).toEqual(
      [reel.dossier, dossierAutreMl].map(String).sort()
    );
    expect(await missionLocaleEffectifsLogDb().distinct("_id")).toEqual([reel.log]);
    expect(await missionLocaleCfaInvitationsDb().distinct("_id")).toEqual([invitationReelle]);
    expect(await usersMigrationDb().distinct("_id")).toEqual([reel.user]);
  });

  it("compte sans écrire en dry-run", async () => {
    await effectifsDb().insertOne(testDocs<IEffectif>([{ _id: seedId("effectif", 1) }])[0]);

    const report = await seedRecette({ hosts, dryRun: true, uninstall: true });

    expect(report.purge.effectifs).toBe(1);
    expect(report.flagsRetires).toEqual({ missionsLocales: 1, organisationsCfa: 5, organismes: 5 });
    expect(await effectifsDb().countDocuments()).toBe(1);
    expect(await organismesDb().countDocuments({ is_allowed_collab: true })).toBe(5);
  });

  it("refuse la désinstallation quand un hôte a une activité réelle", async () => {
    await effectifsDb().insertOne(
      testDocs<IEffectif>([{ _id: new ObjectId(), organisme_id: hosts.cfas.CFA_ON.organismeId }])[0]
    );

    await expect(seedRecette({ hosts, uninstall: true })).rejects.toThrow(/activité réelle/);

    expect(await organismesDb().countDocuments({ is_allowed_collab: true })).toBe(5);
  });

  it("retire les flags des hôtes à la désinstallation", async () => {
    const report = await seedRecette({ hosts, uninstall: true });

    expect(report.flagsRetires).toEqual({ missionsLocales: 1, organisationsCfa: 5, organismes: 5 });
    expect(await organisationsDb().countDocuments({ activated_at: { $exists: true } })).toBe(0);
    expect(await organismesDb().countDocuments({ is_allowed_collab: { $exists: true } })).toBe(0);
  });

  it("décale la date de naissance d'un jeune fictif quand un vrai dossier porte déjà son identité", async () => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dateVoulue = subDays(subYears(today, 20), 31);
    const reel = { nom: "BERNARD", prenom: "Lucas", date_de_naissance: dateVoulue };
    await missionLocaleEffectifsDb().insertOne(
      testDocs<IMissionLocaleEffectif>([
        {
          _id: new ObjectId(),
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          identifiant_normalise: reel,
        },
      ])[0]
    );

    await seedRecette({ hosts, now });

    const fictif = await missionLocaleEffectifsDb().findOne({ _id: seedId("dossierMl", 1) });
    expect(fictif?.identifiant_normalise).toMatchObject({ nom: "BERNARD", prenom: "Lucas" });
    expect(fictif?.identifiant_normalise?.date_de_naissance).toEqual(subDays(dateVoulue, 1));
  });

  it("pose les flags de chaque hôte", async () => {
    const report = await seedRecette({ hosts });

    expect(report.flagsRetires).toBeNull();
    const organisme = (code: keyof SeedRecetteHosts["cfas"]) =>
      organismesDb().findOne({ _id: hosts.cfas[code].organismeId });
    expect(await organisme("CFA_ON")).toMatchObject({ is_allowed_collab: true, has_account: true });
    expect(await organisme("CFA_SUSP")).toMatchObject({
      is_allowed_collab: true,
      collab_suspended_at: expect.any(Date),
    });
    expect(await organisme("CFA_DECA")).toMatchObject({ is_allowed_collab: true, is_allowed_deca: true });
    expect(await organisme("CFA_OFF")).not.toHaveProperty("is_allowed_collab");
    expect(await organisme("CFA_SANS")).toMatchObject({ has_account: false });
    expect(await organisationsDb().findOne({ _id: hosts.missionsLocales.ML_A })).toMatchObject({
      activated_at: expect.any(Date),
      rdv_url: expect.any(String),
    });
    expect(await organisationsDb().findOne({ _id: hosts.missionsLocales.ML_B })).not.toHaveProperty("activated_at");
  });
});
