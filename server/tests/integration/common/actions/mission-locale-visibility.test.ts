import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationMissionLocale } from "shared/models";
import { API_EFFECTIF_LISTE } from "shared/models/data/missionLocaleEffectif.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import {
  getAllEffectifForMissionLocaleCursor,
  getEffectifARisqueByMissionLocaleId,
  getEffectifsParMoisByMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
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

const missionLocale = {
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

const flatten = (result: Array<{ data: Array<{ nom: string }> }>) => result.flatMap(({ data }) => data);

async function insertMlRecord(overrides: Record<string, any> = {}, apprenantOverrides: Record<string, any> = {}) {
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "VISIBILITE",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
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
      _computed: {
        ...snapshot._computed,
        statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.INSCRIT },
      },
    },
    effectif_snapshot_date: new Date(),
    created_at: new Date(),
    date_rupture: null,
    current_status: { value: STATUT_APPRENANT.INSCRIT, date: new Date() },
    ...overrides,
  };
  await missionLocaleEffectifsDb().insertOne(doc as any);
  return doc;
}

const collabDossier = (reponseAt: Date, extra: Record<string, any> = {}) => ({
  organisme_data: { acc_conjoint: true, reponse_at: reponseAt },
  ...extra,
});

describe("Visibilité mission locale des dossiers sans date de rupture", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
    await organisationsDb().insertOne(missionLocale as any);
  });

  it("rend visible un dossier de collaboration sans date de rupture dans la liste à traiter", async () => {
    await insertMlRecord(collabDossier(monthsAgo(1)));

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    expect(flatten(result as any)).toHaveLength(1);
  });

  it("le rattache au mois de son envoi", async () => {
    const reponseAt = monthsAgo(2);
    await insertMlRecord(collabDossier(reponseAt));

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    const bucket = result.find(({ month }) => month === monthKeyOf(reponseAt));
    expect(bucket?.data).toHaveLength(1);
  });

  it("le rend visible dans la liste prioritaire", async () => {
    await insertMlRecord(collabDossier(monthsAgo(1)));

    const result = await getEffectifARisqueByMissionLocaleId(missionLocale, API_EFFECTIF_LISTE.PRIORITAIRE);

    expect(result.effectifs).toHaveLength(1);
    expect(result.effectifs[0].acc_conjoint).toBe(true);
  });

  it("garde visible un dossier de collaboration au-delà de 26 ans", async () => {
    await insertMlRecord(collabDossier(monthsAgo(1)), {
      date_de_naissance: new Date(new Date().getFullYear() - 27, 0, 1),
    });

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    expect(flatten(result as any)).toHaveLength(1);
  });

  it("laisse hors de la liste un dossier de plus de 26 ans sans collaboration", async () => {
    await insertMlRecord(
      { date_rupture: monthsAgo(1), current_status: { value: STATUT_APPRENANT.RUPTURANT, date: monthsAgo(1) } },
      { date_de_naissance: new Date(new Date().getFullYear() - 27, 0, 1) }
    );

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    expect(flatten(result as any)).toHaveLength(0);
  });

  it("laisse hors de la liste un dossier sans rupture ni collaboration", async () => {
    await insertMlRecord();

    const result = await getEffectifsParMoisByMissionLocaleId(missionLocale, { type: API_EFFECTIF_LISTE.A_TRAITER });

    expect(flatten(result as any)).toHaveLength(0);
  });

  it("n'élargit pas le curseur d'hydratation sur la collection effectifs", async () => {
    await effectifsDb().deleteMany({});
    const effectif = await createSampleEffectif({
      organisme: sampleOrganisme,
      annee_scolaire: ANNEE_SCOLAIRE,
      apprenant: {
        nom: "CURSEUR",
        prenom: "Test",
        date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
        adresse: { mission_locale_id: 42 },
      },
    });
    await effectifsDb().insertOne({ ...effectif, _id: new ObjectId(), organisme_id: organismeId } as any);

    const cursor = getAllEffectifForMissionLocaleCursor(42);

    expect(await cursor.toArray()).toHaveLength(0);
  });
});
