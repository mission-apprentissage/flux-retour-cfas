import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import {
  FRANCE_TRAVAIL_SITUATION_ENUM,
  type IFranceTravailEffectif,
} from "shared/models/data/franceTravailEffectif.model";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { beforeEach, describe, expect, it } from "vitest";

import {
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { repointerLiensVersJumeau } from "@/jobs/effectifs/repointer-liens";
import { useMongo } from "@tests/jest/setupMongo";
import {
  avecStatut,
  creerMissionLocale,
  creerOrganisme,
  DATE_STATUT,
  identite,
  insererDossierMl,
  insererEffectif,
  ML_ID,
  NOW,
} from "@tests/utils/effectifsJumeaux";
import { testDoc } from "@tests/utils/testUtils";

const apprenant = { ...identite, adresse: { mission_locale_id: 42 } };

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
    await creerMissionLocale();
    fiche = await insererEffectif({ organisme: ancien, apprenant, statut: STATUT_APPRENANT.RUPTURANT });
    jumeau = await insererEffectif({ organisme: recent, apprenant, statut: STATUT_APPRENANT.RUPTURANT });
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
