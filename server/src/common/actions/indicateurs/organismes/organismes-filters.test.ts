import { strict as assert } from "assert";

import { ObjectId } from "mongodb";
import { it, expect, describe } from "vitest";

import { buildOrganismeMongoFilters, buildOrganismePerimetreMongoFilters } from "./organismes-filters";

describe("Filtres Indicateurs", () => {
  describe("buildOrganismeMongoFilters()", () => {
    it("Gère le filtre organisme_departements", () => {
      const stages = buildOrganismeMongoFilters(
        {
          organisme_departements: ["56"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          "adresse.departement": {
            $in: ["56"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre organisme_regions", () => {
      const stages = buildOrganismeMongoFilters(
        {
          organisme_regions: ["25"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          "adresse.region": {
            $in: ["25"],
          },
        },
        {},
      ]);
    });

    it("Gère le filtre organisme_bassinDemploi", () => {
      const stages = buildOrganismeMongoFilters(
        {
          organisme_bassinsEmploi: ["Maubeuge"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          "adresse.bassinEmploi": {
            $in: ["Maubeuge"],
          },
        },
        {},
      ]);
    });

    it("Gère tous les filtres en même temps", () => {
      const stages = buildOrganismeMongoFilters(
        {
          organisme_regions: ["25"],
          organisme_departements: ["56"],
          organisme_bassinsEmploi: ["Maubeuge"],
        },
        true
      );
      assert.deepStrictEqual(stages, [
        {
          "adresse.region": {
            $in: ["25"],
          },
          "adresse.departement": {
            $in: ["56"],
          },
          "adresse.bassinEmploi": {
            $in: ["Maubeuge"],
          },
        },
        {},
      ]);
    });

    it("Gère la restriction de scope", () => {
      const stages = buildOrganismeMongoFilters(
        {
          organisme_departements: ["56"],
        },
        {
          departement: { $in: ["59", "56"] },
        }
      );
      assert.deepStrictEqual(stages, [
        {
          "adresse.departement": {
            $in: ["56"],
          },
        },
        {
          "adresse.departement": {
            $in: ["59", "56"],
          },
        },
      ]);
    });
  });

  describe("buildOrganismePerimetreMongoFilters", () => {
    it("throw an exception when scope is false", () => {
      expect(() => buildOrganismePerimetreMongoFilters(false)).toThrow("Accés refusé");
    });

    it("should return empty filter when scope is true", () => {
      expect(buildOrganismePerimetreMongoFilters(true)).toEqual({});
    });

    it("should support scope restriction by id", () => {
      const id1 = new ObjectId();
      const id2 = new ObjectId();

      const result: any = buildOrganismePerimetreMongoFilters({ id: { $in: [id1.toString(), id2.toString()] } });
      expect(result).toMatchObject({
        _id: {
          $in: [expect.anything(), expect.anything()],
        },
      });

      expect(id1.equals(result._id.$in[0])).toBe(true);
      expect(id2.equals(result._id.$in[1])).toBe(true);
    });

    it("should support scope restriction by reseau", () => {
      const result = buildOrganismePerimetreMongoFilters({
        reseau: {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
      });
      expect(result).toEqual({
        reseaux: {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
      });
    });

    it("should support scope restriction by region", () => {
      const result = buildOrganismePerimetreMongoFilters({
        region: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "adresse.region": {
          $in: ["10"],
        },
      });
    });

    it("should support scope restriction by departement", () => {
      const result = buildOrganismePerimetreMongoFilters({
        departement: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "adresse.departement": {
          $in: ["10"],
        },
      });
    });

    it("should support scope restriction by academie", () => {
      const result = buildOrganismePerimetreMongoFilters({
        academie: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        "adresse.academie": {
          $in: ["10"],
        },
      });
    });

    it("should support scope combinaison", () => {
      const result = buildOrganismePerimetreMongoFilters({
        reseau: {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
        academie: {
          $in: ["10"],
        },
      });
      expect(result).toEqual({
        reseaux: {
          $in: ["ADEN", "AGRI_UNMFREO"],
        },
        "adresse.academie": {
          $in: ["10"],
        },
      });
    });
  });
});
