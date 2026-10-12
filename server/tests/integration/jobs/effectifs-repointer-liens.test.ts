import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import {
  FRANCE_TRAVAIL_SITUATION_ENUM,
  type IFranceTravailEffectif,
} from "shared/models/data/franceTravailEffectif.model";
import { SITUATION_ENUM, type IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { getAnneeScolaireFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import {
  effectifsDb,
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { repointerLiensVersJumeau } from "@/jobs/effectifs/repointer-liens";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

const NOW = new Date("2026-09-30T12:00:00Z");
const DATE_STATUT = new Date("2026-01-01T00:00:00Z");
const ANNEE = getAnneeScolaireFromDate(NOW);
const SOURCE = new ObjectId().toString();
const ML_ID = new ObjectId();

const identite = { nom: "DURAND", prenom: "Léa", date_de_naissance: new Date("2007-03-04T00:00:00Z") };

type Statut = (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT];

const avecStatut = (effectif: IEffectif, statut: Statut): IEffectif => ({
  ...effectif,
  _computed: {
    ...effectif._computed,
    statut: { en_cours: statut, parcours: [{ valeur: statut, date: DATE_STATUT }] },
  },
});

async function creerOrganisme(nom: string): Promise<IOrganisme> {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme(), nom };
  await organismesDb().insertOne(organisme);
  return organisme;
}

async function insererEffectif(organisme: IOrganisme, statut: Statut): Promise<IEffectif> {
  const effectif = avecStatut(
    {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme,
        annee_scolaire: ANNEE,
        id_erp_apprenant: "A1",
        source_organisme_id: SOURCE,
        apprenant: { ...identite, adresse: { mission_locale_id: 42 } },
      })),
      transmitted_at: NOW,
    } as IEffectif,
    statut
  );
  await effectifsDb().insertOne(effectif);
  return effectif;
}

async function insererDossierMl(effectif: IEffectif, extra: Partial<IMissionLocaleEffectif> = {}) {
  const dossier = testDoc<IMissionLocaleEffectif>({
    mission_locale_id: ML_ID,
    effectif_id: effectif._id,
    effectif_snapshot: effectif,
    effectif_snapshot_date: NOW,
    date_rupture: null,
    created_at: NOW,
    current_status: { value: effectif._computed?.statut?.en_cours ?? null, date: DATE_STATUT },
    ...extra,
  });
  await missionLocaleEffectifsDb().insertOne(dossier);
  return dossier;
}

const saisie = (situation: FRANCE_TRAVAIL_SITUATION_ENUM) => ({
  situation,
  created_at: NOW,
  commentaire: null,
  created_by: new ObjectId(),
});

async function insererDossierFt(effectif: IEffectif, ftData: IFranceTravailEffectif["ft_data"]) {
  const dossier = testDoc<IFranceTravailEffectif>({
    _id: effectif._id,
    created_at: NOW,
    effectif_id: effectif._id,
    effectif_snapshot: effectif,
    effectif_snapshot_date: NOW,
    date_inscription: DATE_STATUT,
    romes: { code: ["A1101"] },
    current_status: { value: STATUT_APPRENANT.INSCRIT, date: DATE_STATUT },
    ft_data: ftData,
    person_id: null,
  });
  await franceTravailEffectifsDb().insertOne(dossier);
  return dossier;
}

describe("repointerLiensVersJumeau", () => {
  useMongo();

  let ancien: IOrganisme;
  let recent: IOrganisme;
  let fiche: IEffectif;
  let jumeau: IEffectif;

  beforeEach(async () => {
    await getDatabase().command({ collMod: "voeuxAffelnet", validationLevel: "off" });
    ancien = await creerOrganisme("CMAR NOUVELLE AQUITAINE");
    recent = await creerOrganisme("CMA FORMATION NIORT");
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({ _id: ML_ID, type: "MISSION_LOCALE", ml_id: 42, nom: "ML Niort", created_at: NOW })
    );
    fiche = await insererEffectif(ancien, STATUT_APPRENANT.RUPTURANT);
    jumeau = await insererEffectif(recent, STATUT_APPRENANT.RUPTURANT);
  });

  it("re-pointe le dossier ML vers le jumeau quand celui-ci n'en a pas", async () => {
    const dossier = await insererDossierMl(fiche, { situation: SITUATION_ENUM.RDV_PRIS });

    const resultat = await repointerLiensVersJumeau(fiche._id, jumeau);

    expect(resultat.ml).toEqual({ repointes: 1, fusionnes: 0, refuses: 0 });
    expect(resultat.missions_locales).toEqual([ML_ID]);
    const migre = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
    expect(migre?.effectif_id).toEqual(jumeau._id);
    expect(migre?.effectif_snapshot._id).toEqual(jumeau._id);
    expect(migre?.effectif_snapshot.organisme_id).toEqual(recent._id);
    expect(migre?.situation).toBe(SITUATION_ENUM.RDV_PRIS);
    expect(migre?.soft_deleted).toBeFalsy();
  });

  it("aligne le mode de visibilité du dossier ML sur le CFA du jumeau", async () => {
    const activation = new Date("2026-05-01T00:00:00Z");
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        type: "ORGANISME_FORMATION",
        organisme_id: recent._id.toString(),
        siret: recent.siret,
        uai: recent.uai,
        ml_beta_activated_at: activation,
        created_at: NOW,
      })
    );
    await organismesDb().updateOne({ _id: recent._id }, { $set: { is_allowed_collab: true } });
    const dossier = await insererDossierMl(fiche, {
      computed: {
        organisme: {
          ml_beta_activated_at: null,
          is_allowed_collab: false,
          collab_suspended_at: new Date("2026-06-01T00:00:00Z"),
        },
      },
    });

    await repointerLiensVersJumeau(fiche._id, jumeau);

    const migre = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
    expect(migre?.computed?.organisme).toEqual({ ml_beta_activated_at: activation, is_allowed_collab: true });
  });

  it("fusionne le dossier ML dans celui du jumeau, ré-attache les logs et soft-delete l'ancien", async () => {
    const dossier = await insererDossierMl(fiche, { situation: SITUATION_ENUM.RDV_PRIS });
    const dossierJumeau = await insererDossierMl(jumeau);
    await organismesDb().updateOne({ _id: recent._id }, { $set: { is_allowed_collab: true } });
    await missionLocaleEffectifsLogDb().insertOne(
      testDoc<IMissionLocaleEffectifLog>({
        mission_locale_effectif_id: dossier._id,
        situation: SITUATION_ENUM.RDV_PRIS,
        created_at: NOW,
        read_by: [],
      })
    );

    const resultat = await repointerLiensVersJumeau(fiche._id, jumeau);

    expect(resultat.ml).toEqual({ repointes: 0, fusionnes: 1, refuses: 0 });
    expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.soft_deleted).toBe(true);
    const keeper = await missionLocaleEffectifsDb().findOne({ _id: dossierJumeau._id });
    expect(keeper?.effectif_id).toEqual(jumeau._id);
    expect(keeper?.situation).toBe(SITUATION_ENUM.RDV_PRIS);
    expect(keeper?.computed?.organisme).toMatchObject({ is_allowed_collab: true });
    expect((await missionLocaleEffectifsLogDb().findOne({}))?.mission_locale_effectif_id).toEqual(dossierJumeau._id);
  });

  it("refuse la migration quand le jumeau n'est plus rupturant et laisse France Travail et les vœux intacts", async () => {
    await insererDossierMl(fiche);
    await insererDossierFt(fiche, { 1: saisie(FRANCE_TRAVAIL_SITUATION_ENUM.ENTREPRISE) });
    await voeuxAffelnetDb().insertOne(testDoc<IVoeuAffelnet>({ effectif_id: fiche._id }));

    const resultat = await repointerLiensVersJumeau(fiche._id, avecStatut(jumeau, STATUT_APPRENANT.APPRENTI));

    expect(resultat).toEqual({
      ml: { repointes: 0, fusionnes: 0, refuses: 1 },
      france_travail: { repointes: 0, fusionnes: 0 },
      voeux: 0,
      missions_locales: [],
    });
    expect((await missionLocaleEffectifsDb().findOne({ effectif_id: fiche._id }))?.soft_deleted).toBeFalsy();
    expect((await franceTravailEffectifsDb().findOne({ _id: fiche._id }))?.soft_deleted).toBeFalsy();
    expect(await franceTravailEffectifsDb().countDocuments({ _id: jumeau._id })).toBe(0);
    expect((await voeuxAffelnetDb().findOne({}))?.effectif_id).toEqual(fiche._id);
  });

  it("recrée le dossier France Travail sous l'id du jumeau en conservant les données saisies", async () => {
    const saisieEntreprise = saisie(FRANCE_TRAVAIL_SITUATION_ENUM.ENTREPRISE);
    await insererDossierFt(fiche, { 1: saisieEntreprise, 2: null });

    const resultat = await repointerLiensVersJumeau(fiche._id, jumeau);

    expect(resultat.france_travail).toEqual({ repointes: 1, fusionnes: 0 });
    const nouveau = await franceTravailEffectifsDb().findOne({ _id: jumeau._id });
    expect(nouveau).toMatchObject({
      effectif_id: jumeau._id,
      created_at: NOW,
      date_inscription: DATE_STATUT,
      romes: { code: ["A1101"] },
      ft_data: { 1: saisieEntreprise, 2: null },
      current_status: { value: STATUT_APPRENANT.RUPTURANT, date: DATE_STATUT },
    });
    expect(nouveau?.effectif_snapshot._id).toEqual(jumeau._id);
    expect(nouveau?.soft_deleted).toBeFalsy();
    expect((await franceTravailEffectifsDb().findOne({ _id: fiche._id }))?.soft_deleted).toBe(true);
  });

  it("complète les données France Travail manquantes du jumeau et soft-delete l'ancien dossier", async () => {
    const saisieAncienne = saisie(FRANCE_TRAVAIL_SITUATION_ENUM.ENTREPRISE);
    const saisieJumeau = saisie(FRANCE_TRAVAIL_SITUATION_ENUM.REORIENTATION);
    await insererDossierFt(fiche, { 1: saisieAncienne, 2: saisie(FRANCE_TRAVAIL_SITUATION_ENUM.EVENEMENT) });
    await insererDossierFt(jumeau, { 1: null, 2: saisieJumeau });

    const resultat = await repointerLiensVersJumeau(fiche._id, jumeau);

    expect(resultat.france_travail).toEqual({ repointes: 0, fusionnes: 1 });
    const keeper = await franceTravailEffectifsDb().findOne({ _id: jumeau._id });
    expect(keeper?.ft_data).toEqual({ 1: saisieAncienne, 2: saisieJumeau });
    expect(keeper?.soft_deleted).toBe(false);
    expect((await franceTravailEffectifsDb().findOne({ _id: fiche._id }))?.soft_deleted).toBe(true);
  });

  it("re-pointe les vœux Affelnet vers le jumeau", async () => {
    await voeuxAffelnetDb().insertOne(testDoc<IVoeuAffelnet>({ effectif_id: fiche._id }));

    const resultat = await repointerLiensVersJumeau(fiche._id, jumeau);

    expect(resultat.voeux).toBe(1);
    expect((await voeuxAffelnetDb().findOne({}))?.effectif_id).toEqual(jumeau._id);
  });
});
