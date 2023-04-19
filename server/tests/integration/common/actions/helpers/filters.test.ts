import { strict as assert } from "assert";
import { ObjectId } from "mongodb";
import { buildMongoPipelineFilterStages } from "@/common/actions/helpers/filters.js";

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
        {
          $match: {},
        },
      ]);
    });
    it("Gère le filtre organisme_id", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        organisme_id: new ObjectId("635acdad5e798f12bd919861"),
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
        {
          $match: {},
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
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "_computed.organisme.departement": "56",
          },
        },
        {
          $match: {},
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
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "_computed.organisme.region": "25",
          },
        },
        {
          $match: {},
        },
      ]);
    });
    it("Gère le filtre etablissement_reseaux", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        etablissement_reseaux: "AGRI",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "_computed.organisme.reseaux": "AGRI",
          },
        },
        {
          $match: {},
        },
      ]);
    });
    it("Gère le filtre siret_etablissement", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        siret_etablissement: "84412312300008",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "_computed.organisme.siret": "84412312300008",
          },
        },
        {
          $match: {},
        },
      ]);
    });
    it("Gère le filtre uai_etablissement", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        uai_etablissement: "0112233A",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "_computed.organisme.uai": "0112233A",
          },
        },
        {
          $match: {},
        },
      ]);
    });
    it("Gère le filtre formation_cfd", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        formation_cfd: "25021000",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "formation.cfd": "25021000",
          },
        },
        {
          $match: {},
        },
      ]);
    });
    it("Gère le filtre niveau_formation", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        niveau_formation: "2",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "formation.niveau": "2",
          },
        },
        {
          $match: {},
        },
      ]);
    });
    it("Gère tous les filtres en même temps", () => {
      const stages = buildMongoPipelineFilterStages({
        date: currentDate,
        etablissement_num_region: "25",
        etablissement_num_departement: "56",
        etablissement_reseaux: "AGRI",
        siret_etablissement: "84412312300008",
        uai_etablissement: "0112233A",
        organisme_id: new ObjectId("635acdad5e798f12bd919863"),
        formation_cfd: "25021000",
        niveau_formation: "2",
      });
      assert.deepStrictEqual(stages, [
        {
          $match: {
            annee_scolaire: {
              $in: ["2022-2022", "2022-2023"],
            },
            "formation.cfd": "25021000",
            "formation.niveau": "2",
            organisme_id: new ObjectId("635acdad5e798f12bd919863"),
            "_computed.organisme.region": "25",
            "_computed.organisme.departement": "56",
            "_computed.organisme.siret": "84412312300008",
            "_computed.organisme.uai": "0112233A",
            "_computed.organisme.reseaux": "AGRI",
          },
        },
        {
          $match: {},
        },
      ]);
      it("Gère tous les filtres avec une restriction", () => {
        const stages = buildMongoPipelineFilterStages({
          date: currentDate,
          etablissement_num_region: "25",
          etablissement_num_departement: "56",
          etablissement_reseaux: "AGRI",
          siret_etablissement: "84412312300008",
          uai_etablissement: "0112233A",
          organisme_id: new ObjectId("635acdad5e798f12bd919863"),
          formation_cfd: "25021000",
          niveau_formation: "2",
          restrictionMongo: {
            "_computed.organisme.departement": "29",
          },
        });
        assert.deepStrictEqual(stages, [
          {
            $match: {
              annee_scolaire: {
                $in: ["2022-2022", "2022-2023"],
              },
              "formation.cfd": "25021000",
              "formation.niveau": "2",
              organisme_id: new ObjectId("635acdad5e798f12bd919863"),
              "_computed.organisme.region": "25",
              "_computed.organisme.departement": "56",
              "_computed.organisme.siret": "84412312300008",
              "_computed.organisme.uai": "0112233A",
              "_computed.organisme.reseaux": "AGRI",
            },
          },
          {
            $match: {
              "_computed.organisme.departement": "29",
            },
          },
        ]);
      });
    });
  });
});
