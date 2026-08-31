import { ObjectId } from "mongodb";
import { ML_SITUATION_DOSSIER, STATUT_APPRENANT } from "shared/constants";
import { IOrganisationMissionLocale } from "shared/models";
import {
  API_EFFECTIF_LISTE,
  CFA_RISQUE_RUPTURE_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import {
  getEffectifsFusionnesByMissionLocaleId,
  getEffectifsListByMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

const missionLocale: IOrganisationMissionLocale = {
  _id: mlOrganisationId,
  type: "MISSION_LOCALE",
  ml_id: 42,
  nom: "ML Test",
  created_at: new Date(),
} as IOrganisationMissionLocale;

const NOW = Date.now();
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000);
const yearsAgo = (years: number) => {
  const d = new Date(NOW);
  d.setFullYear(d.getFullYear() - years);
  return d;
};

async function insertMlRecord(
  nom: string,
  overrides: Record<string, any> = {},
  apprenantOverrides: Record<string, any> = {}
) {
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom,
      prenom: "Test",
      date_de_naissance: yearsAgo(20),
      ...apprenantOverrides,
    },
  });

  const doc = {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: new ObjectId(),
    effectif_snapshot: {
      ...snapshot,
      _id: new ObjectId(),
      organisme_id: organismeId,
      apprenant: { ...snapshot.apprenant, ...apprenantOverrides },
      _computed: {
        ...snapshot._computed,
        statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT },
      },
    },
    effectif_snapshot_date: new Date(NOW),
    date_rupture: daysAgo(30),
    created_at: daysAgo(30),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: daysAgo(30) },
    ...overrides,
  };
  await missionLocaleEffectifsDb().insertOne(doc as any);
  return doc;
}

const collabData = (overrides: Record<string, any> = {}) => ({
  acc_conjoint: true,
  reponse_at: daysAgo(2),
  has_unread_notification: false,
  situation_type: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
  ...overrides,
});

const noms = (result: { effectifs: Array<Record<string, unknown>> }) => result.effectifs.map((e) => e.nom);

describe("getEffectifsFusionnesByMissionLocaleId", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
    await organisationsDb().insertOne(missionLocale as any);
  });

  describe("liste fusionnée (dossiers prioritaires)", () => {
    it("mélange à traiter et à recontacter, exclut les traités", async () => {
      await insertMlRecord("ATRAITER");
      await insertMlRecord("ARECONTACTER", { situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR });
      await insertMlRecord("TRAITE", { situation: SITUATION_ENUM.RDV_PRIS, date_traitement: daysAgo(1) });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(noms(result).sort()).toEqual(["ARECONTACTER", "ATRAITER"]);
      expect(result.counts.a_traiter_ou_recontacter).toBe(2);
    });

    it("trie par critères de priorité : collaboration CFA > souhaite un RDV > mineur > RQTH > sans critère", async () => {
      await insertMlRecord("SANSCRITERE");
      await insertMlRecord("RQTH", {}, { rqth: true });
      await insertMlRecord("MINEUR", {}, { date_de_naissance: yearsAgo(17) });
      await insertMlRecord("RDV", { souhaite_rdv: true });
      await insertMlRecord("COLLAB", { organisme_data: collabData() });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(noms(result)).toEqual(["COLLAB", "RDV", "MINEUR", "RQTH", "SANSCRITERE"]);
    });

    it("à critères égaux, place les dossiers à recontacter avant les dossiers à traiter", async () => {
      await insertMlRecord("ATRAITER", { date_rupture: daysAgo(3) });
      await insertMlRecord("ARECONTACTER", {
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        date_rupture: daysAgo(10),
        // action ML récente : pas de nudge, seul le statut le place devant
        date_dernier_passage_a_recontacter: daysAgo(1),
        date_derniere_action_ml: daysAgo(1),
      });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(noms(result)).toEqual(["ARECONTACTER", "ATRAITER"]);
    });

    it("le nudge fait passer un dossier sans action depuis 7 jours devant les critères de priorité", async () => {
      await insertMlRecord("COLLABFRAIS", { organisme_data: collabData() });
      // dossier à recontacter sans collaboration, dernière action il y a 8 jours
      await insertMlRecord("NUDGE", {
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        date_dernier_passage_a_recontacter: daysAgo(8),
        date_derniere_action_ml: daysAgo(8),
      });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(noms(result)).toEqual(["NUDGE", "COLLABFRAIS"]);
      expect(result.effectifs[0].relance_urgente).toBe(true);
    });

    it("nudge un dossier de collaboration à traiter jamais touché depuis sa réception il y a 8 jours", async () => {
      await insertMlRecord("COLLABNUDGE", {
        organisme_data: collabData({ reponse_at: daysAgo(8) }),
      });
      await insertMlRecord("COLLABFRAIS", { organisme_data: collabData() });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(noms(result)).toEqual(["COLLABNUDGE", "COLLABFRAIS"]);
    });

    it("ne nudge pas un dossier à traiter sans collaboration, même ancien", async () => {
      await insertMlRecord("VIEUXATRAITER", { created_at: daysAgo(20), date_rupture: daysAgo(20) });
      await insertMlRecord("COLLABFRAIS", { organisme_data: collabData() });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(noms(result)).toEqual(["COLLABFRAIS", "VIEUXATRAITER"]);
      expect(result.effectifs.every((e) => e.relance_urgente === false)).toBe(true);
    });

    it("expose les dates de suivi et le statut dérivé de chaque dossier", async () => {
      await insertMlRecord("DATES", {
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        date_dernier_passage_a_recontacter: daysAgo(2),
        date_derniere_action_ml: daysAgo(2),
      });

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      const [dossier] = result.effectifs;
      expect(dossier.a_traiter).toBe(false);
      expect(dossier.injoignable).toBe(true);
      expect(dossier.date_dernier_passage_a_recontacter).toEqual(daysAgo(2));
      expect(dossier.date_reception).toEqual(daysAgo(30));
    });
  });

  describe("listes collaborations CFA", () => {
    it("ne renvoie que les dossiers de collaboration, avec les compteurs des deux sous-onglets", async () => {
      await insertMlRecord("HORSCOLLAB");
      await insertMlRecord("COLLABATRAITER", { organisme_data: collabData() });
      await insertMlRecord("COLLABRECONTACT", {
        organisme_data: collabData(),
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
      });
      await insertMlRecord("COLLABTRAITE", {
        organisme_data: collabData(),
        situation: SITUATION_ENUM.RDV_PRIS,
        date_traitement: daysAgo(1),
      });

      const aTraiter = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER
      );
      expect(noms(aTraiter).sort()).toEqual(["COLLABATRAITER", "COLLABRECONTACT"]);
      expect(aTraiter.counts).toEqual({ a_traiter_ou_recontacter: 2, traite: 1 });

      const traites = await getEffectifsFusionnesByMissionLocaleId(missionLocale, API_EFFECTIF_LISTE.COLLAB_TRAITE);
      expect(noms(traites)).toEqual(["COLLABTRAITE"]);
      expect(traites.counts).toEqual({ a_traiter_ou_recontacter: 2, traite: 1 });
    });

    it("trie les dossiers traités par date de traitement décroissante", async () => {
      await insertMlRecord("TRAITEANCIEN", {
        organisme_data: collabData(),
        situation: SITUATION_ENUM.RDV_PRIS,
        date_traitement: daysAgo(10),
      });
      await insertMlRecord("TRAITERECENT", {
        organisme_data: collabData(),
        situation: SITUATION_ENUM.RDV_PRIS,
        date_traitement: daysAgo(1),
      });

      const result = await getEffectifsFusionnesByMissionLocaleId(missionLocale, API_EFFECTIF_LISTE.COLLAB_TRAITE);
      expect(noms(result)).toEqual(["TRAITERECENT", "TRAITEANCIEN"]);
    });
  });

  describe("export des nouvelles listes", () => {
    it("exporte la situation du dossier et les dates de suivi", async () => {
      await insertMlRecord("EXPORTCOLLAB", {
        organisme_data: collabData({
          situation_type: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
          risque_rupture: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
        }),
        situation: SITUATION_ENUM.RDV_PRIS,
        date_traitement: daysAgo(1),
      });

      const lignes = await getEffectifsListByMissionLocaleId(missionLocale, {
        type: API_EFFECTIF_LISTE.COLLAB_TRAITE,
      });

      expect(lignes).toHaveLength(1);
      expect(lignes[0]).toMatchObject({
        nom: "EXPORTCOLLAB",
        situation_dossier: ML_SITUATION_DOSSIER.PREVENTION_RUPTURE,
        date_traitement: daysAgo(1),
      });
      expect(lignes[0].date_reception).toBeInstanceOf(Date);
    });

    it("restreint l'export des collaborations aux dossiers envoyés par un CFA", async () => {
      await insertMlRecord("HORSCOLLAB");
      await insertMlRecord("AVECCOLLAB", { organisme_data: collabData() });

      const lignes = await getEffectifsListByMissionLocaleId(missionLocale, {
        type: API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER,
      });

      expect(lignes.map(({ nom }) => nom)).toEqual(["AVECCOLLAB"]);
    });
  });

  describe("situation_dossier", () => {
    it.each([
      {
        nom: "PREVENTION",
        overrides: {
          organisme_data: collabData({
            situation_type: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
            risque_rupture: CFA_RISQUE_RUPTURE_ENUM.MODERE,
          }),
        },
        attendu: ML_SITUATION_DOSSIER.PREVENTION_RUPTURE,
      },
      {
        nom: "BESOINAIDE",
        overrides: {
          organisme_data: collabData({
            situation_type: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
            risque_rupture: CFA_RISQUE_RUPTURE_ENUM.FAIBLE,
          }),
        },
        attendu: ML_SITUATION_DOSSIER.BESOIN_AIDE_HORS_RUPTURE,
      },
      {
        nom: "SANSCONTRAT",
        overrides: { organisme_data: collabData({ situation_type: CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT }) },
        attendu: ML_SITUATION_DOSSIER.INSCRIT_SANS_CONTRAT,
      },
      {
        // le statut ERP ne doit pas l'emporter sur la qualification du CFA
        nom: "RUPTUREMAINTENUCFA",
        overrides: {
          organisme_data: collabData({ still_at_cfa: true }),
          current_status: { value: STATUT_APPRENANT.INSCRIT, date: daysAgo(30) },
        },
        attendu: ML_SITUATION_DOSSIER.RUPTURE,
      },
      {
        nom: "ABANDONCFA",
        overrides: { organisme_data: collabData({ date_abandon: daysAgo(5), still_at_cfa: false }) },
        attendu: ML_SITUATION_DOSSIER.ABANDON,
      },
      {
        nom: "RUPTURECOLLAB",
        overrides: { organisme_data: collabData() },
        attendu: ML_SITUATION_DOSSIER.RUPTURE,
      },
      {
        nom: "RUPTUREPURE",
        overrides: {},
        attendu: ML_SITUATION_DOSSIER.RUPTURE,
      },
      {
        nom: "ABANDONERP",
        overrides: { current_status: { value: STATUT_APPRENANT.ABANDON, date: daysAgo(30) } },
        attendu: ML_SITUATION_DOSSIER.ABANDON,
      },
    ])("mappe $nom vers $attendu", async ({ nom, overrides, attendu }) => {
      await insertMlRecord(nom, overrides);

      const result = await getEffectifsFusionnesByMissionLocaleId(
        missionLocale,
        API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
      );

      expect(result.effectifs).toHaveLength(1);
      expect(result.effectifs[0].situation_dossier).toBe(attendu);
    });
  });
});
