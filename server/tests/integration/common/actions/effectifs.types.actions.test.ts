import { addDays } from "date-fns";
import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import { addDaysUTC } from "shared/utils";
import { it, expect, describe, beforeEach } from "vitest";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import { hydrateEffectifsComputedTypesGenerique } from "@/jobs/hydrate/effectifs/hydrate-effectifs-computed-types";
import { createSampleEffectif, createRandomOrganisme, createRandomFormation } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const TEST_SIREN = "190404921";
const ANNEE_SCOLAIRE = "2023-2024";

const formationDateEntree = new Date("2023-09-30T00:00:00.000Z");
const formationDateFin = new Date("2026-06-28T00:00:00.000Z");
const formation = createRandomFormation(ANNEE_SCOLAIRE, formationDateEntree, formationDateFin);

const evaluationDate = new Date("2025-07-01T00:00:00.000Z");

const sampleOrganismeId = new ObjectId(id(1));
const sampleOrganisme: IOrganisme = {
  _id: sampleOrganismeId,
  ...createRandomOrganisme({ siret: `${TEST_SIREN}00016` }),
};

describe("hydrateEffectifsComputedTypesGenerique", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  describe("apprenent en formation sans contrat", () => {
    it("doit avoir le statut inscrit si moins de 90 jours", async () => {
      const moinsDe90Jours = new Date(formationDateEntree.getTime());
      moinsDe90Jours.setDate(moinsDe90Jours.getDate() + 89);

      const effectif = await createSampleEffectif({
        organisme: sampleOrganisme,
        contrats: [],
        formation,
      });

      const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: moinsDe90Jours });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.INSCRIT);
    });

    it("doit avoir le statut abandon si plus de 90 jours", async () => {
      const plusDe90Jours = new Date(formationDateEntree.getTime());
      plusDe90Jours.setDate(plusDe90Jours.getDate() + 91);

      const effectif = await createSampleEffectif({
        organisme: sampleOrganisme,
        contrats: [],
        formation,
      });

      const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: plusDe90Jours });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.ABANDON);
    });
  });

  describe("apprenent en formation avec contrat", () => {
    it("doit avoir le statut apprenti", async () => {
      const effectif = await createSampleEffectif({
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
      await hydrateEffectifsComputedTypesGenerique();

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.APPRENTI);
    });
  });

  describe("apprenent en formation avec rupture de contrat", () => {
    it("ne doit  pas avoir le statut d'apprenti si rupture de contrat avant le début du contrat", async () => {
      const ruptureDate = addDays(formation.date_entree, -10);
      const dateDebutContrat = addDays(ruptureDate, -5);

      const customEvalutationDate = new Date(formation.date_entree.getTime() + 10);
      const effectif = await createSampleEffectif({
        organisme: sampleOrganisme,
        contrats: [
          {
            date_debut: dateDebutContrat,
            date_fin: formation.date_fin,
            date_rupture: ruptureDate,
          },
        ],
        formation,
      });

      const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: customEvalutationDate });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      const abandonDate = addDays(ruptureDate, 180);
      // Gestion du changement d'heure
      abandonDate.setUTCHours(0);

      expect(updatedEffectif?._computed?.statut?.parcours).toEqual([
        { valeur: STATUT_APPRENANT.APPRENTI, date: dateDebutContrat },
        { valeur: STATUT_APPRENANT.RUPTURANT, date: ruptureDate },
        { valeur: STATUT_APPRENANT.ABANDON, date: abandonDate },
        { valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: formationDateFin },
      ]);
    });

    it("doit avoir le statut rupturant si rupture de moins de 180 jours", async () => {
      const ruptureDate = new Date(evaluationDate.getTime());
      ruptureDate.setDate(ruptureDate.getDate() - 179);

      const effectif = await createSampleEffectif({
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
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.RUPTURANT);
    });

    it("doit avoir le statut abandon si rupture de plus de 180 jours", async () => {
      const ruptureDate = new Date(evaluationDate.getTime());
      ruptureDate.setDate(ruptureDate.getDate() - 181);

      const effectif = await createSampleEffectif({
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
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.ABANDON);
    });
  });

  describe("apprenent en formation avec diplome", () => {
    it("doit avoir le statut fin de formation", async () => {
      const formationWithDiploma = {
        ...createRandomFormation(
          "2023-2024",
          new Date("2023-12-20T00:00:00.000+00:00"),
          new Date("2024-08-11T00:00:00.000+00:00")
        ),
        obtention_diplome: true,
      };

      const effectif = await createSampleEffectif({
        organisme: sampleOrganisme,
        contrats: [
          {
            date_debut: new Date("2023-01-23T00:00:00.000Z"),
            date_fin: new Date("2024-06-30T00:00:00.000Z"),
          },
        ],
        formation: formationWithDiploma,
      });

      const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
      const evaluationDateAfterDiploma = new Date(2026, 8, 1);

      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: evaluationDateAfterDiploma });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut?.en_cours).toEqual(STATUT_APPRENANT.FIN_DE_FORMATION);
    });
  });

  describe("apprenent en formation avec plusieurs contrats", () => {
    it("doit générer l'historique du statut de l'apprenant", async () => {
      const ruptureFirstContratDate = addDaysUTC(evaluationDate, -250);

      const effectif = await createSampleEffectif({
        organisme: sampleOrganisme,
        contrats: [
          {
            date_debut: addDaysUTC(formation.date_entree, 45),
            date_fin: formation.date_fin,
            date_rupture: ruptureFirstContratDate,
          },
          {
            date_debut: addDaysUTC(ruptureFirstContratDate, 10),
            date_fin: formation.date_fin,
          },
        ],
        formation: formation,
      });

      const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate });

      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });

      expect(updatedEffectif?._computed?.statut).toEqual({
        en_cours: "APPRENTI",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2023-09-30T00:00:00.000Z") },
          { valeur: "APPRENTI", date: new Date("2023-11-14T00:00:00.000Z") },
          { valeur: "RUPTURANT", date: new Date("2024-10-24T00:00:00.000Z") },
          { valeur: "APPRENTI", date: new Date("2024-11-03T00:00:00.000Z") },
          { valeur: "FIN_DE_FORMATION", date: formationDateFin },
        ],
      });
    });
  });

  describe("apprenent sans date de formation", () => {
    it("doit gérer un statut à partir de l'historique_statut", async () => {
      const effectif = await createSampleEffectif({
        apprenant: {
          historique_statut: [
            {
              valeur_statut: 3,
              date_statut: new Date("2021-10-06T00:00:00.000Z"),
              date_reception: new Date("2022-07-06T22:00:22.548Z"),
            },
            {
              valeur_statut: 0,
              date_statut: new Date("2022-10-29T00:00:00.000Z"),
              date_reception: new Date("2022-10-29T22:00:38.848Z"),
            },
            {
              valeur_statut: 2,
              date_statut: new Date("2023-01-05T00:00:00.000Z"),
              date_reception: new Date("2023-01-02T22:00:18.565Z"),
            },
          ],
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
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: new Date(2023, 6, 1) });
      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });
      expect(updatedEffectif?._computed?.statut).toEqual({
        en_cours: STATUT_APPRENANT.RUPTURANT,
        parcours: [
          { valeur: STATUT_APPRENANT.INSCRIT, date: new Date("2021-08-01T00:00:00.000Z") },
          { valeur: STATUT_APPRENANT.APPRENTI, date: new Date("2021-10-06T00:00:00.000Z") },
          { valeur: STATUT_APPRENANT.RUPTURANT, date: new Date("2023-01-05T00:00:00.000Z") },
          { valeur: STATUT_APPRENANT.ABANDON, date: new Date("2023-07-04T00:00:00.000Z") },
          { valeur: STATUT_APPRENANT.FIN_DE_FORMATION, date: new Date("2023-07-31T00:00:00.000Z") },
        ],
      });
    });
    it("ne doit pas gérer de statut sans l'historique_statut", async () => {
      const effectif = await createSampleEffectif({
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
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: new Date(2023, 6, 1) });
      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });
      expect(updatedEffectif?._computed?.statut).toBeNull();
    });
    it("doit gérer le statut sans periode de formation", async () => {
      const effectif = await createSampleEffectif({
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
        annee_scolaire: "2021-2023",
      });
      const { insertedId } = await effectifsDb().insertOne(effectif as IEffectif);
      await hydrateEffectifsComputedTypesGenerique({ evaluationDate: new Date(2023, 6, 1) });
      const updatedEffectif = await effectifsDb().findOne({ _id: insertedId });
      expect(updatedEffectif?._computed?.statut).toEqual({
        en_cours: "FIN_DE_FORMATION",
        parcours: [
          {
            date: new Date("2021-08-01T00:00:00.000Z"),
            valeur: "INSCRIT",
          },
          {
            date: new Date("2021-09-06T00:00:00.000Z"),
            valeur: "APPRENTI",
          },
          {
            date: new Date("2022-07-06T00:00:00.000Z"),
            valeur: "RUPTURANT",
          },
          {
            date: new Date("2023-01-02T00:00:00.000Z"),
            valeur: "ABANDON",
          },
          {
            date: new Date("2023-07-31T00:00:00.000Z"),
            valeur: "FIN_DE_FORMATION",
          },
        ],
      });
    });
  });
});
