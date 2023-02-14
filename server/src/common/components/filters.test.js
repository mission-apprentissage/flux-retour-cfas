import { strict as assert } from "assert";
import { ObjectId } from "mongodb";
import { buildMongoPipelineFilterStages } from "./filters.js";

const currentDate = new Date("2023-02-14T10:00:00Z");

describe("Filtres Indicateurs", () => {
  describe("buildMongoPipelineFilterStages()", () => {
    it("Gère le filtre date uniquement", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
          },
        },
      ]);
    });
    it("Gère le filtre organisme_id", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        organisme_id: "635acdad5e798f12bd919861",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            organisme_id: new ObjectId("635acdad5e798f12bd919861"),
          },
        },
      ]);
    });
    it("Gère le filtre organisme_ids", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        organisme_ids: ["635acdad5e798f12bd919861", "635acdad5e798f12bd919862"],
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            organisme_id: {
              $in: ["635acdad5e798f12bd919861", "635acdad5e798f12bd919862"],
            },
          },
        },
      ]);
    });
    it("Gère le filtre etablissement_num_departement", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        etablissement_num_departement: "56",
      });
      assert.deepStrictEqual(stages, [
        {
          $lookup: {
            from: "organismes",
            localField: "organisme_id",
            foreignField: "_id",
            as: "organisme",
          },
        },
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "organisme.adresse.departement": "56",
          },
        },
      ]);
    });
    it("Gère le filtre etablissement_num_region", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        etablissement_num_region: "25",
      });
      assert.deepStrictEqual(stages, [
        {
          $lookup: {
            from: "organismes",
            localField: "organisme_id",
            foreignField: "_id",
            as: "organisme",
          },
        },
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "organisme.adresse.region": "25",
          },
        },
      ]);
    });
    it("Gère tous les filtres en même temps", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        etablissement_num_region: "25",
        etablissement_num_departement: "56",
        organisme_id: "635acdad5e798f12bd919863", // overridden by organisme_ids
        organisme_ids: ["635acdad5e798f12bd919861", "635acdad5e798f12bd919862"],
      });
      assert.deepStrictEqual(stages, [
        {
          $lookup: {
            from: "organismes",
            localField: "organisme_id",
            foreignField: "_id",
            as: "organisme",
          },
        },
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "organisme.adresse.region": "25",
            "organisme.adresse.departement": "56",
            organisme_id: {
              $in: ["635acdad5e798f12bd919861", "635acdad5e798f12bd919862"],
            },
          },
        },
      ]);
    });
  });
});
