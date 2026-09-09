import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationMissionLocale } from "shared/models";
import { API_EFFECTIF_LISTE, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import { getEffectifsParMoisByMissionLocaleId } from "@/common/actions/mission-locale/mission-locale.actions";
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

const monthsAgo = (months: number) => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - months, 15);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const monthKeyOf = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();

async function insertMlRecord(overrides: Record<string, any> = {}) {
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "PARMOIS",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
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
      _computed: {
        ...snapshot._computed,
        statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT },
      },
    },
    effectif_snapshot_date: new Date(),
    created_at: new Date(),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date() },
    ...overrides,
  };
  await missionLocaleEffectifsDb().insertOne(doc as any);
  return doc;
}

describe("getEffectifsParMoisByMissionLocaleId", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
    await organisationsDb().insertOne(missionLocale as any);
  });

  it("regroupe un dossier rupturant sur le mois de sa date de rupture", async () => {
    const dateRupture = monthsAgo(2);
    await insertMlRecord({ date_rupture: dateRupture });

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    const bucket = result.find(({ month }) => month === monthKeyOf(dateRupture));
    expect(bucket?.data).toHaveLength(1);
  });

  it("classe un dossier de plus de 180 jours hors des buckets mensuels", async () => {
    const dateRupture = monthsAgo(8);
    await insertMlRecord({ date_rupture: dateRupture });

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    const bucket = result.find(({ month }) => month === "plus-de-180-j");
    expect(bucket?.data).toHaveLength(1);
  });

  describe("dossiers traités navigués par année", () => {
    it("renvoie chaque mois réel, sur plusieurs années, sans regrouper les plus de 180 jours", async () => {
      const moisRecent = monthsAgo(1);
      const moisAncien = monthsAgo(10);
      const moisTresAncien = monthsAgo(20);
      for (const dateRupture of [moisRecent, moisAncien, moisTresAncien]) {
        await insertMlRecord({ date_rupture: dateRupture, situation: SITUATION_ENUM.RDV_PRIS });
      }

      const result = await getEffectifsParMoisByMissionLocaleId(
        missionLocale,
        { type: API_EFFECTIF_LISTE.TRAITE },
        undefined,
        true
      );

      const mois = result.map(({ month }) => month);
      expect(mois).not.toContain("plus-de-180-j");
      expect(mois).toEqual([monthKeyOf(moisRecent), monthKeyOf(moisAncien), monthKeyOf(moisTresAncien)]);
      expect(result.every(({ data }) => data.length === 1)).toBe(true);
    });

    it("regroupe toujours les plus de 180 jours quand la navigation par année n'est pas demandée", async () => {
      await insertMlRecord({ date_rupture: monthsAgo(10), situation: SITUATION_ENUM.RDV_PRIS });

      const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.TRAITE });

      expect(result.find(({ month }) => month === "plus-de-180-j")?.data).toHaveLength(1);
    });
  });

  describe("sous-onglet À traiter ou recontacter", () => {
    it("mélange les dossiers à traiter et à recontacter dans le même mois, sans les traités", async () => {
      const dateRupture = monthsAgo(1);
      await insertMlRecord({ date_rupture: dateRupture, situation: null });
      await insertMlRecord({ date_rupture: dateRupture, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR });
      await insertMlRecord({ date_rupture: dateRupture, situation: SITUATION_ENUM.RDV_PRIS });

      const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, {
        type: API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
      });

      const bucket = result.find(({ month }) => month === monthKeyOf(dateRupture));
      expect(bucket?.data).toHaveLength(2);
      expect(bucket?.data.map((e: any) => e.injoignable).sort()).toEqual([false, true]);
    });

    it("ne compte pas les dossiers à recontacter comme traités", async () => {
      const dateRupture = monthsAgo(1);
      await insertMlRecord({ date_rupture: dateRupture, situation: null });
      await insertMlRecord({ date_rupture: dateRupture, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR });
      await insertMlRecord({ date_rupture: dateRupture, situation: SITUATION_ENUM.RDV_PRIS });

      const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, {
        type: API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
      });

      const bucket = result.find(({ month }) => month === monthKeyOf(dateRupture));
      expect(bucket?.treated_count).toBe(1);
    });

    it("expose les dates de suivi de chaque dossier", async () => {
      const dateRupture = monthsAgo(1);
      const dateRecontact = monthsAgo(0);
      await insertMlRecord({
        date_rupture: dateRupture,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        date_dernier_passage_a_recontacter: dateRecontact,
        date_derniere_action_ml: dateRecontact,
      });

      const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, {
        type: API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
      });

      const bucket = result.find(({ month }) => month === monthKeyOf(dateRupture));
      const dossier: any = bucket?.data[0];
      expect(dossier.date_dernier_passage_a_recontacter).toEqual(dateRecontact);
      // « reçu le » se base sur la réception du dossier, jamais sur la date de rupture
      expect(dossier.date_reception).not.toEqual(dateRupture);
      expect(dossier.date_reception).toBeInstanceOf(Date);
    });
  });
});
