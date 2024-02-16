import { addDays, format } from "date-fns";
import { ObjectId } from "mongodb";
import { Contrat } from "shared/models/apis/@types/ApiDeca";

import { contratsDecaDb } from "@/common/model/collections";
import { buildPeriodsToFetch, getLastDecaCreatedDateInDb } from "@/jobs/hydrate/deca/hydrate-deca";
import { dataDeca } from "@tests/data/apiDeca";
import { useMongo } from "@tests/jest/setupMongo";

describe("Job hydrateContratsDeca", () => {
  useMongo();
  describe("getLastDecaCreatedDateInDb", () => {
    it("Vérifie la non récupération de la dernière date d'ajout d'une entrée dans la collection contratsDeca si la collection est vide", async () => {
      await expect(getLastDecaCreatedDateInDb()).resolves.toStrictEqual(null);
    });

    it("Vérifie la récupération de la dernière date d'ajout d'une entrée dans la collection contratsDeca pour une date dans le passé", async () => {
      const dateToTest = addDays(new Date(), -10);

      // Ajout des 2 contrats de test en base
      await contratsDecaDb().insertMany(
        dataDeca.contrats.map((currentContrat) => ({
          ...(currentContrat as Contrat),
          _id: new ObjectId(),
          created_at: dateToTest,
        }))
      );

      await expect(getLastDecaCreatedDateInDb()).resolves.toStrictEqual(dateToTest);
    });

    it("Vérifie la récupération de la dernière date d'ajout d'une entrée dans la collection contratsDeca pour la date du jour", async () => {
      // Mock de la date système via jest
      import.meta.jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2023-06-01"));

      // Ajout des 2 contrats de test en base
      await contratsDecaDb().insertMany(
        dataDeca.contrats.map((currentContrat) => ({
          ...(currentContrat as Contrat),
          _id: new ObjectId(),
          created_at: new Date(),
        }))
      );

      await expect(getLastDecaCreatedDateInDb()).resolves.toStrictEqual(addDays(new Date(), -1));
    });
  });

  describe("buildPeriodsToFetch", () => {
    it("Vérifie la récupération d'une liste de périodes vide si la dateDebut est après la dateFin", () => {
      expect(buildPeriodsToFetch(addDays(new Date(), 10), new Date(), 30)).toStrictEqual([]);
    });

    it("Vérifie la récupération d'une liste de périodes avec un seul élément si la durée entre dateDebut et dateFin est < à nbJoursMaxPeriodeFetch", () => {
      expect(buildPeriodsToFetch(new Date(), addDays(new Date(), 10), 30)).toStrictEqual([
        {
          dateDebut: format(new Date(), "yyyy-MM-dd"),
          dateFin: format(addDays(new Date(), 10), "yyyy-MM-dd"),
        },
      ]);
    });

    it("Vérifie la récupération d'une liste de périodes avec plusieurs éléments si la durée entre dateDebut et dateFin est > à nbJoursMaxPeriodeFetch", () => {
      const dateDebutTest = addDays(new Date(), -30);
      const dateFinTest = addDays(new Date(), -1);

      expect(buildPeriodsToFetch(dateDebutTest, dateFinTest, 10)).toStrictEqual([
        {
          dateDebut: format(dateDebutTest, "yyyy-MM-dd"),
          dateFin: format(addDays(dateDebutTest, 10), "yyyy-MM-dd"),
        },
        {
          dateDebut: format(addDays(dateDebutTest, 11), "yyyy-MM-dd"),
          dateFin: format(addDays(dateDebutTest, 21), "yyyy-MM-dd"),
        },
        {
          dateDebut: format(addDays(dateDebutTest, 22), "yyyy-MM-dd"),
          dateFin: format(dateFinTest, "yyyy-MM-dd"),
        },
      ]);
    });
  });
});
