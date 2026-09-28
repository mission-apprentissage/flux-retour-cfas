import type { ICommune } from "api-alternance-sdk";
import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { SITUATION_ENUM, type IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisationMissionLocale } from "shared/models/data/organisations.model";
import { getAnneeScolaireFromDate } from "shared/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import {
  communesVoiesDb,
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
} from "@/common/model/collections";
import { viderCacheCommunesVoies } from "@/common/services/commune/resoudreCodeInsee";
import { migrateCommuneApprenant } from "@/jobs/migration/migrate-commune-apprenant";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { rechercheCommune: vi.fn() } },
}));

function commune(insee: string, nom: string, missionLocaleId: number): ICommune {
  return {
    nom,
    code: { insee, postaux: ["02100"] },
    anciennes: [],
    arrondissements: [],
    departement: { nom: "Aisne", codeInsee: "02" },
    region: { nom: "Hauts-de-France", codeInsee: "32" },
    academie: { id: "A20", code: "20", nom: "Amiens" },
    localisation: {
      centre: { type: "Point", coordinates: [3.28, 49.84] },
      bbox: { type: "Polygon", coordinates: [] },
    },
    mission_locale: { id: missionLocaleId } as ICommune["mission_locale"],
  };
}

const adresseDevinee = {
  code_postal: "02100",
  code_insee: "02288",
  commune: "Essigny-le-Petit",
  departement: "02",
  region: "32",
  academie: "20",
  mission_locale_id: 486,
} as const;

async function insererEffectif(adresse: Record<string, unknown>) {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme() };
  const effectif = { _id: new ObjectId(), ...(await createSampleEffectif({ organisme, apprenant: { adresse } })) };
  await effectifsDb().insertOne(testDoc<IEffectif>(effectif));
  return effectif;
}

async function insererEffectifDECA(adresse: Record<string, unknown>) {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme() };
  const effectif = {
    _id: new ObjectId(),
    deca_raw_id: new ObjectId(),
    is_deca_compatible: true,
    ...(await createSampleEffectif({ organisme, apprenant: { adresse }, source: SOURCE_APPRENANT.DECA })),
  };
  await effectifsDECADb().insertOne(testDoc<IEffectifDECA>(effectif));
  return effectif;
}

async function insererDossierMl<T extends { _id: ObjectId }>(
  effectif: T,
  params: { mission_locale_id?: ObjectId } & Partial<IMissionLocaleEffectif> = {}
) {
  const dossier = {
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(),
    effectif_id: effectif._id,
    effectif_snapshot: effectif,
    effectif_snapshot_date: new Date(),
    created_at: new Date(),
    current_status: { value: null, date: null },
    brevo: { token: null, token_created_at: null },
    soft_deleted: false,
    ...params,
  };
  await missionLocaleEffectifsDb().insertOne(testDoc<IMissionLocaleEffectif>(dossier));
  return dossier;
}

async function insererMissionLocale(mlId: number, activatedAt?: Date) {
  const organisation: IOrganisationMissionLocale = {
    _id: new ObjectId(),
    type: "MISSION_LOCALE",
    nom: `ML ${mlId}`,
    ml_id: mlId,
    created_at: new Date(),
    ...(activatedAt ? { activated_at: activatedAt } : {}),
  };
  await organisationsDb().insertOne(organisation);
  return organisation;
}

describe("migrateCommuneApprenant", () => {
  useMongo();

  beforeEach(async () => {
    viderCacheCommunesVoies();
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockResolvedValue([
      commune("02288", "Essigny-le-Petit", 486),
      commune("02525", "Morcourt", 999),
      commune("02691", "Saint-Quentin", 486),
    ]);
    await communesVoiesDb().insertOne({
      _id: "02100",
      communes: [
        { code_insee: "02691", nom: "Saint-Quentin", population: 52813 },
        { code_insee: "02288", nom: "Essigny-le-Petit", population: 345 },
        { code_insee: "02525", nom: "Morcourt", population: 500 },
      ],
      voies: [
        { nom: "rue sentier", code_insee: ["02691"] },
        { nom: "rue maurice duverget", code_insee: ["02525"] },
        { nom: "rue ecoles", code_insee: ["02288"] },
      ],
      updated_at: new Date(),
    });
  });

  it("corrige la commune devinée d'un effectif ERP et le snapshot de son dossier ML", async () => {
    const effectif = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    const dossier = await insererDossierMl(effectif);

    const { rapport, changementsMl } = await migrateCommuneApprenant({ dryRun: false });

    const apres = await effectifsDb().findOne({ _id: effectif._id });
    expect(apres?.apprenant.adresse).toMatchObject({
      code_postal: "02100",
      code_insee: "02691",
      commune: "Saint-Quentin",
      mission_locale_id: 486,
      complete: "138 rue du Sentier",
    });
    const dossierApres = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
    expect(dossierApres?.effectif_snapshot.apprenant.adresse).toMatchObject({
      code_insee: "02691",
      commune: "Saint-Quentin",
    });
    expect(dossierApres?.mission_locale_id).toEqual(dossier.mission_locale_id);
    expect(rapport.effectifs).toMatchObject({ devines: 1, modifies: 1, snapshots_ml: 1, changements_ml: 0 });
    expect(rapport.effectifs.methodes.voie).toBe(1);
    expect(changementsMl).toEqual([]);
  });

  it("corrige un effectif DECA à partir du numéro et de la voie et signale le changement de ML", async () => {
    const effectif = await insererEffectifDECA({ ...adresseDevinee, numero: 24, voie: "RUE MAURICE DUVERGET" });
    await insererDossierMl(effectif);

    const { rapport, changementsMl } = await migrateCommuneApprenant({ dryRun: false });

    expect((await effectifsDECADb().findOne({ _id: effectif._id }))?.apprenant.adresse).toMatchObject({
      code_insee: "02525",
      commune: "Morcourt",
      mission_locale_id: 999,
    });
    expect(rapport.effectifsDECA.changements_ml).toBe(1);
    expect(changementsMl).toEqual([{ effectif_id: effectif._id, ancien_ml_id: 486, nouveau_ml_id: 999 }]);
  });

  it("ne touche pas une commune transmise par l'ERP", async () => {
    const effectif = await insererEffectif({
      ...adresseDevinee,
      code_insee: "02525",
      commune: "Morcourt",
      complete: "138 rue du Sentier",
    });
    await insererDossierMl(effectif);

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect((await effectifsDb().findOne({ _id: effectif._id }))?.apprenant.adresse?.code_insee).toBe("02525");
    expect(rapport.effectifs).toMatchObject({ examines: 1, devines: 0, modifies: 0 });
  });

  it("laisse inchangée une commune devinée que l'adresse confirme", async () => {
    await insererDossierMl(await insererEffectif({ ...adresseDevinee, complete: "3 rue des Écoles" }));

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect(rapport.effectifs).toMatchObject({ devines: 1, inchanges: 1, modifies: 0 });
  });

  it("n'écrit rien en simulation", async () => {
    const effectif = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    await insererDossierMl(effectif);

    const { rapport } = await migrateCommuneApprenant({ dryRun: true });

    expect((await effectifsDb().findOne({ _id: effectif._id }))?.apprenant.adresse?.code_insee).toBe("02288");
    expect(rapport.effectifs.modifies).toBe(1);
  });

  it("prend pour commune devinée la première commune renvoyée par API Apprentissage", async () => {
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockResolvedValue([
      commune("02691", "Saint-Quentin", 486),
      commune("02288", "Essigny-le-Petit", 486),
      commune("02525", "Morcourt", 999),
    ]);
    const devine = await insererEffectif({
      ...adresseDevinee,
      code_insee: "02691",
      commune: "Saint-Quentin",
      complete: "24 rue Maurice Duverget",
    });
    const transmis = await insererEffectif({ ...adresseDevinee, complete: "24 rue Maurice Duverget" });
    await insererDossierMl(devine);
    await insererDossierMl(transmis);

    await migrateCommuneApprenant({ dryRun: false });

    expect((await effectifsDb().findOne({ _id: devine._id }))?.apprenant.adresse?.code_insee).toBe("02525");
    expect((await effectifsDb().findOne({ _id: transmis._id }))?.apprenant.adresse?.code_insee).toBe("02288");
  });

  it("compte les échecs d'API Apprentissage sans interrompre le job", async () => {
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockRejectedValue(new Error("API indisponible"));
    await insererDossierMl(await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" }));
    await insererDossierMl(await insererEffectif({ ...adresseDevinee, complete: "24 rue Maurice Duverget" }));

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect(rapport.effectifs).toMatchObject({ examines: 2, erreurs_api: 2, modifies: 0 });
  });

  it("ne réécrit pas le snapshot d'un dossier dont le code postal diffère de l'effectif", async () => {
    const effectif = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    const dossier = await insererDossierMl({
      ...effectif,
      apprenant: { ...effectif.apprenant, adresse: { ...adresseDevinee, code_postal: "02000" } },
    });

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect(
      (await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.effectif_snapshot.apprenant.adresse
    ).toMatchObject({ code_postal: "02000", code_insee: "02288" });
    expect(rapport.effectifs).toMatchObject({ modifies: 1, snapshots_ml: 0 });
  });

  it("ignore les effectifs sans dossier ML actif hors de l'année scolaire en cours", async () => {
    const sansDossier = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    const dossierSupprime = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    await insererDossierMl(dossierSupprime, { soft_deleted: true });
    await effectifsDb().updateMany({}, { $set: { annee_scolaire: "2020-2021" } });

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    for (const effectif of [sansDossier, dossierSupprime]) {
      expect((await effectifsDb().findOne({ _id: effectif._id }))?.apprenant.adresse?.code_insee).toBe("02288");
    }
    expect(rapport.effectifs.examines).toBe(0);
  });

  it("corrige un effectif de l'année scolaire en cours sans dossier ML", async () => {
    const effectif = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    await effectifsDb().updateOne(
      { _id: effectif._id },
      { $set: { annee_scolaire: getAnneeScolaireFromDate(new Date()) } }
    );

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect((await effectifsDb().findOne({ _id: effectif._id }))?.apprenant.adresse?.code_insee).toBe("02691");
    expect(rapport.effectifs).toMatchObject({ examines: 1, modifies: 1, snapshots_ml: 0 });
  });

  it("refuse de tourner sans référentiel", async () => {
    await communesVoiesDb().deleteMany({});

    await expect(migrateCommuneApprenant({ dryRun: true })).rejects.toThrow(/hydrate:communes-voies/);
  });

  describe("réaffectation des dossiers ML", () => {
    const adresseMorcourt = { ...adresseDevinee, numero: 24, voie: "RUE MAURICE DUVERGET" };
    const activationMorcourt = new Date("2025-03-01");
    let mlEssigny: IOrganisationMissionLocale;
    let mlMorcourt: IOrganisationMissionLocale;

    beforeEach(async () => {
      mlEssigny = await insererMissionLocale(486, new Date("2025-01-01"));
      mlMorcourt = await insererMissionLocale(999, activationMorcourt);
    });

    it("déplace un dossier non traité vers sa nouvelle ML", async () => {
      const effectif = await insererEffectifDECA(adresseMorcourt);
      const dossier = await insererDossierMl(effectif, { mission_locale_id: mlEssigny._id });

      const { rapport } = await migrateCommuneApprenant({ dryRun: false });

      const apres = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
      expect(apres?.mission_locale_id).toEqual(mlMorcourt._id);
      expect(apres?.computed?.mission_locale?.activated_at).toEqual(activationMorcourt);
      expect(rapport.reaffectation).toMatchObject({
        candidats: 1,
        deplaces: 1,
        traites_conserves: 0,
        ecritures_en_erreur: 0,
        stats_en_erreur: 0,
      });
    });

    it("laisse dans sa ML un dossier traité, par situation ou par historique", async () => {
      const avecSituation = await insererDossierMl(await insererEffectifDECA(adresseMorcourt), {
        mission_locale_id: mlEssigny._id,
        situation: SITUATION_ENUM.RDV_PRIS,
      });
      const avecLog = await insererDossierMl(await insererEffectifDECA(adresseMorcourt), {
        mission_locale_id: mlEssigny._id,
      });
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: avecLog._id,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date(),
        created_by: null,
        read_by: [],
      });

      const { rapport, dossiersTraites } = await migrateCommuneApprenant({ dryRun: false });

      for (const dossier of [avecSituation, avecLog]) {
        expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.mission_locale_id).toEqual(
          mlEssigny._id
        );
      }
      expect(rapport.reaffectation).toMatchObject({ deplaces: 0, traites_conserves: 2 });
      expect(dossiersTraites).toEqual(
        expect.arrayContaining([{ dossier_id: avecSituation._id, ml_actuelle: 486, ml_cible: 999 }])
      );
    });

    it("remplace un doublon soft-deleted présent dans la ML cible", async () => {
      const effectif = await insererEffectifDECA(adresseMorcourt);
      const dossier = await insererDossierMl(effectif, { mission_locale_id: mlEssigny._id });
      const doublon = await insererDossierMl(effectif, { mission_locale_id: mlMorcourt._id, soft_deleted: true });

      const { rapport } = await migrateCommuneApprenant({ dryRun: false });

      expect(await missionLocaleEffectifsDb().findOne({ _id: doublon._id })).toBeNull();
      expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.mission_locale_id).toEqual(
        mlMorcourt._id
      );
      expect(rapport.reaffectation).toMatchObject({ deplaces: 1, doublons_supprimes: 1 });
    });

    it("ne touche pas un dossier rattaché à une autre ML que celle de la commune devinée", async () => {
      const autreMl = await insererMissionLocale(777);
      const effectif = await insererEffectifDECA(adresseMorcourt);
      const dossier = await insererDossierMl(effectif, { mission_locale_id: autreMl._id });

      const { rapport } = await migrateCommuneApprenant({ dryRun: false });

      expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.mission_locale_id).toEqual(autreMl._id);
      expect(rapport.reaffectation).toMatchObject({ deplaces: 0, hors_commune_devinee: 1 });
    });

    it("déplace un dossier dont l'effectif a déjà été corrigé par l'ingestion", async () => {
      const effectif = await insererEffectifDECA({
        ...adresseMorcourt,
        code_insee: "02525",
        commune: "Morcourt",
        mission_locale_id: 999,
      });
      const dossier = await insererDossierMl(
        {
          ...effectif,
          apprenant: { ...effectif.apprenant, adresse: { ...effectif.apprenant.adresse, ...adresseDevinee } },
        },
        { mission_locale_id: mlEssigny._id }
      );

      const { rapport } = await migrateCommuneApprenant({ dryRun: false });

      expect(rapport.effectifsDECA.devines).toBe(0);
      const apres = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
      expect(apres?.mission_locale_id).toEqual(mlMorcourt._id);
      expect(apres?.effectif_snapshot.apprenant.adresse).toMatchObject({ code_insee: "02525", commune: "Morcourt" });
      expect(rapport.reaffectation).toMatchObject({ candidats: 1, deplaces: 1 });
    });

    it("ne touche pas un jeune qui a déménagé dans un autre code postal", async () => {
      const effectif = await insererEffectifDECA({ ...adresseDevinee, code_postal: "02000", mission_locale_id: 999 });
      const dossier = await insererDossierMl(
        { ...effectif, apprenant: { ...effectif.apprenant, adresse: adresseDevinee } },
        { mission_locale_id: mlEssigny._id }
      );

      const { rapport } = await migrateCommuneApprenant({ dryRun: false });

      expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.mission_locale_id).toEqual(
        mlEssigny._id
      );
      expect(rapport.reaffectation).toMatchObject({ deplaces: 0, demenagements: 1 });
    });

    it("rattache au dossier déplacé l'historique du doublon supprimé", async () => {
      const effectif = await insererEffectifDECA(adresseMorcourt);
      const dossier = await insererDossierMl(effectif, { mission_locale_id: mlEssigny._id });
      const doublon = await insererDossierMl(effectif, { mission_locale_id: mlMorcourt._id, soft_deleted: true });
      const logId = new ObjectId();
      await missionLocaleEffectifsLogDb().insertOne({
        _id: logId,
        mission_locale_effectif_id: doublon._id,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date(),
        created_by: null,
        read_by: [],
      });

      await migrateCommuneApprenant({ dryRun: false });

      expect((await missionLocaleEffectifsLogDb().findOne({ _id: logId }))?.mission_locale_effectif_id).toEqual(
        dossier._id
      );
    });

    it("ne déplace rien si la ML cible n'a pas d'organisation", async () => {
      await organisationsDb().deleteOne({ _id: mlMorcourt._id });
      const effectif = await insererEffectifDECA(adresseMorcourt);
      const dossier = await insererDossierMl(effectif, { mission_locale_id: mlEssigny._id });

      const { rapport } = await migrateCommuneApprenant({ dryRun: false });

      expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.mission_locale_id).toEqual(
        mlEssigny._id
      );
      expect(rapport.reaffectation).toMatchObject({ deplaces: 0, ml_cible_absente: 1 });
    });

    it("ne déplace rien en simulation", async () => {
      const effectif = await insererEffectifDECA(adresseMorcourt);
      const dossier = await insererDossierMl(effectif, { mission_locale_id: mlEssigny._id });

      const { rapport } = await migrateCommuneApprenant({ dryRun: true });

      expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.mission_locale_id).toEqual(
        mlEssigny._id
      );
      expect(rapport.reaffectation.deplaces).toBe(1);
    });
  });
});
