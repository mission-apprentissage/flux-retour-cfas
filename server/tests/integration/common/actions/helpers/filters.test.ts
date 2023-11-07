import { strict as assert } from "assert";

import { ObjectId } from "mongodb";

import { buildMongoFilters, fullEffectifsFiltersConfigurations } from "@/common/actions/helpers/filters";

const currentDate = new Date("2023-02-14T10:00:00Z");

describe("Filtres Indicateurs", () => {
  describe("buildMongoFilters()", () => {
    it("Gère le filtre date uniquement", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
      ]);
    });

    it("Gère le filtre organisme_departements", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
          organisme_departements: ["56"],
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {
          "_computed.organisme.departement": {
            $in: ["56"],
          },
        },
      ]);
    });

    it("Gère le filtre organisme_regions", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
          organisme_regions: ["25"],
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {
          "_computed.organisme.region": {
            $in: ["25"],
          },
        },
      ]);
    });

    it("Gère le filtre organisme_reseaux", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
          organisme_reseaux: ["AGRI"],
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {
          "_computed.organisme.reseaux": {
            $in: ["AGRI"],
          },
        },
      ]);
    });

    it("Gère le filtre formation_cfds", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
          formation_cfds: ["25021000"],
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {
          "formation.cfd": {
            $in: ["25021000"],
          },
        },
      ]);
    });

    it("Gère le filtre formation_niveaux", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
          formation_niveaux: ["2"],
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {
          "formation.niveau": {
            $in: ["2"],
          },
        },
      ]);
    });

    it("Gère tous les filtres en même temps", () => {
      const stages = buildMongoFilters(
        {
          date: currentDate,
          organisme_regions: ["25"],
          organisme_departements: ["56"],
          organisme_reseaux: ["AGRI"],
          formation_cfds: ["25021000"],
          formation_niveaux: ["2"],
        },
        fullEffectifsFiltersConfigurations
      );
      assert.deepStrictEqual(stages, [
        {
          annee_scolaire: {
            $in: ["2023-2023", "2022-2023"],
          },
        },
        {
          "_computed.organisme.region": {
            $in: ["25"],
          },
        },
        {
          "_computed.organisme.departement": {
            $in: ["56"],
          },
        },
        {
          "_computed.organisme.reseaux": {
            $in: ["AGRI"],
          },
        },
        {
          "formation.cfd": {
            $in: ["25021000"],
          },
        },
        {
          "formation.niveau": {
            $in: ["2"],
          },
        },
      ]);
    });
  });
});
