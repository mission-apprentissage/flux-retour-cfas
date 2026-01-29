import { strict as assert } from "assert";

import { ObjectId } from "mongodb";
import { it, expect, describe } from "vitest";

import { buildEffectifMongoFilters, buildEffectifPerimetreMongoFilters } from "./effectifs-filters";

const currentDate = new Date("2023-02-14T10:00:00Z");

describe("Filtres Indicateurs", () => {
  describe("buildEffectifMongoFilters()", () => {
    it("Gère le filtre date uniquement", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre organisme_departements", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          organisme_departements: ["56"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "_computed.organisme.departement": {
            $in: ["56"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre organisme_regions", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          organisme_regions: ["25"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "_computed.organisme.region": {
            $in: ["25"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre organisme_reseaux", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          organisme_reseaux: ["AGRI"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "_computed.organisme.reseaux": {
            $in: ["AGRI"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre formation_cfds", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          formation_cfds: ["25021000"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "formation.cfd": {
            $in: ["25021000"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre formation_niveaux", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          formation_niveaux: ["2"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "formation.niveau": {
            $in: ["2"],
          },
        },
        {},
      ]);
    });

    it("Gère tous les filtres en même temps", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          organisme_regions: ["25"],
          organisme_departements: ["56"],
          organisme_reseaux: ["AGRI"],
          formation_cfds: ["25021000"],
          formation_niveaux: ["2"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "_computed.organisme.region": {
            $in: ["25"],
          },
          "_computed.organisme.departement": {
            $in: ["56"],
          },
          "_computed.organisme.reseaux": {
            $in: ["AGRI"],
          },
          "formation.cfd": {
            $in: ["25021000"],
          },
          "formation.niveau": {
            $in: ["2"],
          },
        },
        {},
      ]);
    });

    it("Gère la restriction de scope", () => {
      const stages = buildEffectifMongoFilters(
        {
          date: currentDate,
          organisme_departements: ["56"],
        },
        {
          departement: { $in: ["59", "56"] },
        }
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
          "_computed.organisme.departement": {
            $in: ["56"],
          },
        },
        {
          "_computed.organisme.departement": {
            $in: ["59", "56"],
          },
        },
      ]);
    });
  });

  describe("buildEffectifPerimetreMongoFilters", () => {
    it("throw an exception when scope is false", () => {
      expect(() => buildEffectifPerimetreMongoFilters(false)).toThrow("Accés refusé");
    });

    it("should return empty filter when scope is true", () => {
      expect(buildEffectifPerimetreMongoFilters(true)).toEqual({});
    });

    it("should support scope restriction by id", () => {
      const id1 = new ObjectId();
      const id2 = new ObjectId();

      const result: any = buildEffectifPerimetreMongoFilters({ id: { $in: [id1.toString(), id2.toString()] } });
      expect(result).toMatchObject({
        organisme_id: {
          $in: [expect.anything(), expect.anything()],
        },
      });

      expect(id1.equals(result.organisme_id.$in[0])).toBe(true);
      expect(id2.equals(result.organisme_id.$in[1])).toBe(true);
    });

    it("should support scope restriction by reseau", () => {
      const result = buildEffectifPerimetreMongoFilters({
        reseau: {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
      });
      expect(result).toEqual({
        "_computed.organisme.reseaux": {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
      });
    });

    it("should support scope restriction by region", () => {
      const result = buildEffectifPerimetreMongoFilters({
        region: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "_computed.organisme.region": {
          $in: ["10"],
        },
      });
    });

    it("should support scope restriction by departement", () => {
      const result = buildEffectifPerimetreMongoFilters({
        departement: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "_computed.organisme.departement": {
          $in: ["10"],
        },
      });
    });

    it("should support scope restriction by academie", () => {
      const result = buildEffectifPerimetreMongoFilters({
        academie: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "_computed.organisme.academie": {
          $in: ["10"],
        },
      });
    });

    it("should support scope combinaison", () => {
      const result = buildEffectifPerimetreMongoFilters({
        reseau: {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
        academie: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "_computed.organisme.reseaux": {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
        "_computed.organisme.academie": {
          $in: ["10"],
        },
      });
    });
  });
});
