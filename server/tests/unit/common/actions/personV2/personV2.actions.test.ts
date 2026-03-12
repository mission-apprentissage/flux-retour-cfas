import { describe, it, expect } from "vitest";

import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";

describe("normalisePersonIdentifiant", () => {
  describe("normalisation du nom et prénom", () => {
    it("met le nom en majuscule et capitalise le prénom", () => {
      const result = normalisePersonIdentifiant({
        nom: "dupont",
        prenom: "jean",
        date_de_naissance: new Date("2000-01-15T00:00:00Z"),
      });

      expect(result.nom).toBe("DUPONT");
      expect(result.prenom).toBe("Jean");
    });

    it("trim les espaces", () => {
      const result = normalisePersonIdentifiant({
        nom: "  DUPONT  ",
        prenom: "  Jean  ",
        date_de_naissance: new Date("2000-01-15T00:00:00Z"),
      });

      expect(result.nom).toBe("DUPONT");
      expect(result.prenom).toBe("Jean");
    });
  });

  describe("normalisation de date_de_naissance (timezone CET/CEST)", () => {
    it("conserve une date déjà à midnight UTC", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2007-01-09T00:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2007-01-09T00:00:00Z"));
    });

    it("arrondit 23:00 UTC (CET) au jour suivant à midnight", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2007-01-08T23:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2007-01-09T00:00:00Z"));
    });

    it("arrondit 22:00 UTC (CEST) au jour suivant à midnight", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2009-06-25T22:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2009-06-26T00:00:00Z"));
    });

    it("ne modifie pas une date en journée (ex: 12:00 UTC)", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2007-06-15T12:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2007-06-15T00:00:00Z"));
    });

    it("gère le changement de mois (28 fév 23:00 → 1er mars)", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2009-02-28T23:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2009-03-01T00:00:00Z"));
    });

    it("gère le changement d'année (31 déc 23:00 → 1er jan)", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2006-12-31T23:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2007-01-01T00:00:00Z"));
    });

    it("gère le 29 février en année bissextile (28 fév 23:00 → 29 fév)", () => {
      const result = normalisePersonIdentifiant({
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("2008-02-28T23:00:00Z"),
      });

      expect(result.date_de_naissance).toEqual(new Date("2008-02-29T00:00:00Z"));
    });

    it("produit le même résultat pour ERP (23:00 CET) et DECA (00:00 UTC)", () => {
      const erpResult = normalisePersonIdentifiant({
        nom: "CHAMBARD",
        prenom: "Paul",
        date_de_naissance: new Date("2007-01-08T23:00:00Z"),
      });

      const decaResult = normalisePersonIdentifiant({
        nom: "CHAMBARD",
        prenom: "Paul",
        date_de_naissance: new Date("2007-01-09T00:00:00Z"),
      });

      expect(erpResult.date_de_naissance).toEqual(decaResult.date_de_naissance);
      expect(erpResult).toEqual(decaResult);
    });

    it("produit le même résultat pour ERP (22:00 CEST) et DECA (00:00 UTC)", () => {
      const erpResult = normalisePersonIdentifiant({
        nom: "TOTTEL--HATTE",
        prenom: "Corentin",
        date_de_naissance: new Date("2009-06-25T22:00:00Z"),
      });

      const decaResult = normalisePersonIdentifiant({
        nom: "TOTTEL--HATTE",
        prenom: "Corentin",
        date_de_naissance: new Date("2009-06-26T00:00:00Z"),
      });

      expect(erpResult.date_de_naissance).toEqual(decaResult.date_de_naissance);
      expect(erpResult).toEqual(decaResult);
    });
  });
});
