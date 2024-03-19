import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IOrganisme } from "shared/models/data/organismes.model";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import { hydrateEffectifsComputedTypes } from "@/jobs/hydrate/effectifs/hydrate-effectifs-computed-types";
import { createSampleEffectif, createRandomOrganisme, createRandomFormation } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const TEST_SIREN = "190404921";
const ANNEE_SCOLAIRE = "2023-2024";

const formationDateEntree = new Date(2023, 9, 1);
const formationDateFin = new Date(2026, 6, 29);
const formation = createRandomFormation(ANNEE_SCOLAIRE, formationDateEntree, formationDateFin);

const evaluationDate = new Date(2025, 6, 1);

const sampleOrganismeId = new ObjectId(id(1));
const sampleOrganisme: IOrganisme = {
  _id: sampleOrganismeId,
  ...createRandomOrganisme({ siret: `${TEST_SIREN}00016` }),
};

describe("hydrateEffectifsComputedTypes", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("doit correctement gérer un debut de formation sans contrat de moins de 90 jours", async () => {
    const moinsDe90Jours = new Date(formationDateEntree.getTime());
    moinsDe90Jours.setDate(moinsDe90Jours.getDate() + 89);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [],
      formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(moinsDe90Jours);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.INSCRIT);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer un début de formation sans contrat de plus de 90 jours", async () => {
    const plusDe90Jours = new Date(formationDateEntree.getTime());
    plusDe90Jours.setDate(plusDe90Jours.getDate() + 91);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [],
      formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(plusDe90Jours);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.ABANDON);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer un seul contrat sans rupture", async () => {
    const currentDate = new Date();
    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
        },
      ],
      formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(currentDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.APPRENTI);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer un seul contrat avec rupture de moins de 180 jours", async () => {
    const ruptureDate = new Date(evaluationDate.getTime());
    ruptureDate.setDate(ruptureDate.getDate() - 179);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
          date_rupture: ruptureDate,
        },
      ],
      formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(evaluationDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.RUPTURANT);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer un seul contrat avec rupture de plus de 180 jours", async () => {
    const ruptureDate = new Date(evaluationDate.getTime());
    ruptureDate.setDate(ruptureDate.getDate() - 181);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
          date_rupture: ruptureDate,
        },
      ],
      formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(evaluationDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.ABANDON);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer plusieurs contrats avec un contrat en cours", async () => {
    const ruptureDate = new Date(evaluationDate.getTime());
    ruptureDate.setDate(ruptureDate.getDate() - 60);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
          date_rupture: ruptureDate,
        },
        {
          date_debut: new Date(ruptureDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          date_fin: formation.date_fin,
        },
      ],
      formation: formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(evaluationDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.APPRENTI);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer plusieurs contrats avec rupture de moins de 180 jours", async () => {
    const ruptureFirstContratDate = new Date(evaluationDate.getTime());
    ruptureFirstContratDate.setDate(ruptureFirstContratDate.getDate() - 250);

    const ruptureSecondContratDate = new Date(evaluationDate.getTime());
    ruptureSecondContratDate.setDate(ruptureSecondContratDate.getDate() - 179);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
          date_rupture: ruptureFirstContratDate,
        },
        {
          date_debut: new Date(ruptureFirstContratDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          date_fin: formation.date_fin,
          date_rupture: ruptureSecondContratDate,
        },
      ],
      formation: formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(evaluationDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.RUPTURANT);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer plusieurs contrats avec rupture de moins de plus de 180 jours", async () => {
    const ruptureFirstContratDate = new Date(evaluationDate.getTime());
    ruptureFirstContratDate.setDate(ruptureFirstContratDate.getDate() - 250);

    const ruptureSecondContratDate = new Date(evaluationDate.getTime());
    ruptureSecondContratDate.setDate(ruptureSecondContratDate.getDate() - 181);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
          date_rupture: ruptureFirstContratDate,
        },
        {
          date_debut: new Date(ruptureFirstContratDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          date_fin: formation.date_fin,
          date_rupture: ruptureSecondContratDate,
        },
      ],
      formation: formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(evaluationDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.ABANDON);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement gérer le statut de 'Diplômé'", async () => {
    const formationWithDiploma = {
      ...createRandomFormation(ANNEE_SCOLAIRE, formationDateEntree, formationDateFin),
      obtention_diplome: true,
    };

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: formation.date_entree,
          date_fin: formation.date_fin,
        },
      ],
      formation: formationWithDiploma,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    const evaluationDateAfterDiploma = new Date(2026, 8, 1);

    await hydrateEffectifsComputedTypes(evaluationDateAfterDiploma);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.DIPLOME);
    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
  });

  it("doit correctement générer l'historique du statut de l'apprenant", async () => {
    const ruptureFirstContratDate = new Date(evaluationDate.getTime());
    ruptureFirstContratDate.setDate(ruptureFirstContratDate.getDate() - 250);

    const ruptureSecondContratDate = new Date(evaluationDate.getTime());
    ruptureSecondContratDate.setDate(ruptureSecondContratDate.getDate() - 181);

    const effectif = createSampleEffectif({
      organisme: sampleOrganisme,
      contrats: [
        {
          date_debut: new Date(formation.date_entree.getTime() + 45 * 24 * 60 * 60 * 1000),
          date_fin: formation.date_fin,
          date_rupture: ruptureFirstContratDate,
        },
        {
          date_debut: new Date(ruptureFirstContratDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          date_fin: formation.date_fin,
        },
      ],
      formation: formation,
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(evaluationDate);

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.APPRENTI);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
    expect(updatedEffectif?._computed?.statut?.historique).toEqual([
      { mois: "10", annee: "2023", valeur: STATUT_APPRENANT.INSCRIT },
      { mois: "11", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "12", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "01", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "02", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "03", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "04", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "05", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "06", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "07", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "08", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "09", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "10", annee: "2024", valeur: STATUT_APPRENANT.RUPTURANT },
      { mois: "11", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "12", annee: "2024", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "01", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "02", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "03", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "04", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "05", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "06", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "07", annee: "2025", valeur: STATUT_APPRENANT.APPRENTI },
    ]);
  });

  it("doit correctement gérer un statut à partir de l'historique_statut", async () => {
    const effectif = createSampleEffectif({
      apprenant: {
        historique_statut: [
          {
            valeur_statut: 3,
            date_statut: new Date("2021-09-06T00:00:00.000Z"),
            date_reception: new Date("2022-07-06T22:00:22.548Z"),
          },
          {
            valeur_statut: 2,
            date_statut: new Date("2022-07-06T15:26:00.000Z"),
            date_reception: new Date("2022-07-12T22:00:17.906Z"),
          },
          {
            valeur_statut: 3,
            date_statut: new Date("2022-10-29T00:00:00.000Z"),
            date_reception: new Date("2022-10-29T22:00:38.848Z"),
          },
          {
            valeur_statut: 3,
            date_statut: new Date("2023-01-05T00:00:00.000Z"),
            date_reception: new Date("2023-01-02T22:00:18.565Z"),
          },
        ],
      },
      organisme: sampleOrganisme,
      contrats: [],
      formation: {
        ...createRandomFormation("2022-2023"),
        periode: [2021, 2023],
        date_inscription: null,
        date_entree: null,
        date_fin: null,
      },
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(new Date(2023, 6, 1));

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut?.en_cours).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.APPRENTI);

    expect(updatedEffectif?._computed?.statut?.historique).toBeDefined();
    expect(updatedEffectif?._computed?.statut?.historique?.length).toBeGreaterThan(0);
    expect(updatedEffectif?._computed?.statut?.historique).toEqual([
      { mois: "09", annee: "2021", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "10", annee: "2021", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "11", annee: "2021", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "12", annee: "2021", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "01", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "02", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "03", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "04", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "05", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "06", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "07", annee: "2022", valeur: STATUT_APPRENANT.INSCRIT },
      { mois: "08", annee: "2022", valeur: STATUT_APPRENANT.INSCRIT },
      { mois: "09", annee: "2022", valeur: STATUT_APPRENANT.INSCRIT },
      { mois: "10", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "11", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "12", annee: "2022", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "01", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "02", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "03", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "04", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "05", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "06", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
      { mois: "07", annee: "2023", valeur: STATUT_APPRENANT.APPRENTI },
    ]);
  });

  it("ne doit pas gérer de statut sans l'historique_statut", async () => {
    const effectif = createSampleEffectif({
      apprenant: {
        historique_statut: [],
      },
      organisme: sampleOrganisme,
      contrats: [],
      formation: {
        ...createRandomFormation("2021-2023"),
        periode: [2021, 2023],
        date_inscription: null,
        date_entree: null,
        date_fin: null,
      },
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(new Date(2023, 6, 1));

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut).toBeUndefined();
  });

  it("ne doit pas gérer de statut sans periode de formation", async () => {
    const effectif = createSampleEffectif({
      apprenant: {
        historique_statut: [
          {
            valeur_statut: 3,
            date_statut: new Date("2021-09-06T00:00:00.000Z"),
            date_reception: new Date("2022-07-06T22:00:22.548Z"),
          },
          {
            valeur_statut: 2,
            date_statut: new Date("2022-07-06T15:26:00.000Z"),
            date_reception: new Date("2022-07-12T22:00:17.906Z"),
          },
          {
            valeur_statut: 3,
            date_statut: new Date("2022-10-29T00:00:00.000Z"),
            date_reception: new Date("2022-10-29T22:00:38.848Z"),
          },
          {
            valeur_statut: 3,
            date_statut: new Date("2023-01-05T00:00:00.000Z"),
            date_reception: new Date("2023-01-02T22:00:18.565Z"),
          },
        ],
      },
      organisme: sampleOrganisme,
      contrats: [],
      formation: {
        ...createRandomFormation("2021-2023"),
        periode: null,
        date_inscription: null,
        date_entree: null,
        date_fin: null,
      },
    });

    const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
    await hydrateEffectifsComputedTypes(new Date(2023, 6, 1));

    const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

    expect(updatedEffectif?._computed?.statut).toBeUndefined();
  });
});
