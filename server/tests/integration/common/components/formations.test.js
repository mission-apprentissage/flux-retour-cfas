const assert = require("assert").strict;
const omit = require("lodash.omit");
// eslint-disable-next-line node/no-unpublished-require
const nock = require("nock");
const { nockGetCfdInfo } = require("../../../utils/nockApis/nock-tablesCorrespondances");
const { asyncForEach } = require("../../../../src/common/utils/asyncUtils");
const { dataForGetCfdInfo } = require("../../../data/apiTablesDeCorrespondances");
const { dataForGetMetiersByCfd } = require("../../../data/apiLba");
const formationsComponent = require("../../../../src/common/components/formations");
const { FormationModel, DossierApprenantModel } = require("../../../../src/common/model");
const { Formation } = require("../../../../src/common/factory/formation");
const { createRandomDossierApprenant } = require("../../../data/randomizedSample");
const { nockGetMetiersByCfd } = require("../../../utils/nockApis/nock-Lba");

describe(__filename, () => {
  describe("existsFormation", () => {
    const { existsFormation } = formationsComponent();

    it("returns false when formation with formations collection is empty", async () => {
      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns false when formation with given cfd does not exist", async () => {
      // create a formation
      const newFormation = new FormationModel({ cfd: "0123456G" });
      await newFormation.save();

      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns true when formation with given cfd exists", async () => {
      // create a formation
      const newFormation = new FormationModel({ cfd: "0123456G" });
      await newFormation.save();

      const shouldBeTrue = await existsFormation(newFormation.cfd);
      assert.equal(shouldBeTrue, true);
    });
  });

  describe("getFormationWithCfd", () => {
    const { getFormationWithCfd } = formationsComponent();

    it("returns null when formation does not exist", async () => {
      const found = await getFormationWithCfd("blabla");
      assert.equal(found, null);
    });

    it("returns formation with given cfd when it exists", async () => {
      // create a formation
      const cfd = "2502000D";
      const newFormation = new FormationModel({ cfd });
      const createdFormation = await newFormation.save();

      const found = await getFormationWithCfd(cfd);
      assert.deepEqual(createdFormation.toObject(), found);
    });
  });

  describe("createFormation", () => {
    const { createFormation } = formationsComponent();

    it("throws when given cfd is invalid", async () => {
      await assert.rejects(() => createFormation("invalid"), new Error("Invalid CFD"));
    });

    it("throws when formation with given cfd already exists", async () => {
      const cfd = "2502000D";
      // create formation in db
      const formation = new FormationModel({ cfd });
      await formation.save();

      await assert.rejects(() => createFormation(cfd), new Error("A Formation with CFD 2502000D already exists"));
    });

    it("throws when formation data is not valid", async () => {
      nock.cleanAll();
      nockGetCfdInfo({
        ...dataForGetCfdInfo.withIntituleLong,
        date_ouverture: "invalid",
      });

      const cfd = "2502000D";
      await assert.rejects(() => createFormation(cfd));
    });

    it("returns created formation when cfd was found in Tables de Correspondances with intitule_long", async () => {
      nockGetCfdInfo(dataForGetCfdInfo.withIntituleLong);

      const cfd = "13534005";
      const created = await createFormation(cfd);
      assert.deepEqual(omit(created, ["created_at", "_id", "tokenized_libelle"]), {
        cfd,
        cfd_start_date: new Date(dataForGetCfdInfo.withIntituleLong.date_ouverture),
        cfd_end_date: new Date(dataForGetCfdInfo.withIntituleLong.date_fermeture),
        rncps: ["RNCP34945"],
        libelle: "HYGIENISTE DU TRAVAIL ET DE L'ENVIRONNEMENT (CNAM)",
        niveau: "7",
        niveau_libelle: "7 (Master, titre ingénieur...)",
        metiers: dataForGetMetiersByCfd.metiers,
        updated_at: null,
      });
    });

    it("returns created formation when cfd was found in Tables de Correspondances without intitule_long (no rncps found)", async () => {
      nock.cleanAll();
      nockGetMetiersByCfd();
      nockGetCfdInfo(dataForGetCfdInfo.withoutIntituleLong);

      const cfd = "13534005";
      const created = await createFormation(cfd);
      assert.deepEqual(omit(created, ["created_at", "_id", "tokenized_libelle"]), {
        cfd,
        cfd_start_date: new Date(dataForGetCfdInfo.withIntituleLong.date_ouverture),
        cfd_end_date: new Date(dataForGetCfdInfo.withIntituleLong.date_fermeture),
        rncps: [],
        libelle: "",
        niveau: "7",
        niveau_libelle: "7 (Master, titre ingénieur...)",
        metiers: dataForGetMetiersByCfd.metiers,
        updated_at: null,
      });
    });
  });

  describe("searchFormations", () => {
    const { searchFormations } = formationsComponent();

    const formationsSeed = [
      { cfd: "01022103", libelle: "EMPLOYE TRAITEUR (CAP)" },
      { cfd: "01023288", libelle: "ZINGUERIE (MC NIVEAU V)" },
      { cfd: "01022999", libelle: "Peinture décoration extérieure (MC NIVEAU V)" },
      { cfd: "01022111", libelle: "PEINTURE DECORATION (MC NIVEAU IV)" },
      { cfd: "01022551", libelle: "PEINTURE dEcOrAtIoN (MC NIVEAU IV)" },
      { cfd: "01026651", libelle: "PEINTURE DECORÀTION (MC NIVEAU IV)" },
    ];

    beforeEach(async () => {
      await asyncForEach(formationsSeed, async (formationSeed) => {
        const formation = Formation.create(formationSeed);
        await new FormationModel(formation).save();

        await new DossierApprenantModel({
          ...createRandomDossierApprenant(),
          formation_cfd: formation.cfd,
        }).save();
      });
    });

    const validCases = [
      {
        caseDescription: "when searchTerm does not anything",
        searchTerm: "nope",
        expectedResult: [],
      },
      {
        caseDescription: "when searchTerm matches cfd perfectly",
        searchTerm: formationsSeed[0].cfd,
        expectedResult: [formationsSeed[0]],
      },
      {
        caseDescription: "when searchTerm matches cfd partially",
        searchTerm: formationsSeed[0].cfd.slice(0, 6),
        expectedResult: [formationsSeed[0], formationsSeed[3]],
      },
      {
        caseDescription: "when searchTerm matches libelle perfectly",
        searchTerm: formationsSeed[0].libelle,
        expectedResult: [formationsSeed[0]],
      },
      {
        caseDescription: "when searchTerm matches libelle partially",
        searchTerm: formationsSeed[0].libelle.slice(0, 5),
        expectedResult: [formationsSeed[0]],
      },
      {
        caseDescription: "when searchTerm matches a word in libelle",
        searchTerm: "ZINGUERIE",
        expectedResult: [formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches a word partially in libelle",
        searchTerm: "ZINGU",
        expectedResult: [formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches a word with different case in libelle",
        searchTerm: "zingu",
        expectedResult: [formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches a word with different diacritics in libelle",
        searchTerm: "zingùéri",
        expectedResult: [formationsSeed[1]],
      },
    ];

    validCases.forEach(({ searchTerm, caseDescription, expectedResult }) => {
      it(`returns results ${caseDescription}`, async () => {
        const results = await searchFormations({ searchTerm });

        const mapCfd = (result) => result.cfd;
        assert.deepEqual(results.map(mapCfd), expectedResult.map(mapCfd));
      });
    });

    it("sends a 200 HTTP response with results matching different cases and diacritics in libelle", async () => {
      const searchTerm = "decoratio";

      const results = await searchFormations({ searchTerm });

      assert.equal(results.length, 4);
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[2].cfd));
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[3].cfd));
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[4].cfd));
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[5].cfd));
    });

    it("returns results matching libelle and etablissement_num_region", async () => {
      const searchTerm = "decoration";
      const etablissement_num_region = "28";

      await new DossierApprenantModel({
        ...createRandomDossierApprenant(),
        etablissement_num_region,
        formation_cfd: formationsSeed[2].cfd,
      }).save();

      const results = await searchFormations({ searchTerm, etablissement_num_region });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and etablissement_num_departement", async () => {
      const searchTerm = "decoration";
      const etablissement_num_departement = "77";

      await new DossierApprenantModel({
        ...createRandomDossierApprenant(),
        etablissement_num_departement,
        formation_cfd: formationsSeed[2].cfd,
      }).save();

      const results = await searchFormations({ searchTerm, etablissement_num_departement });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and etablissement_reseau", async () => {
      const searchTerm = "decoration";
      const etablissement_reseaux = "RESEAU_TEST";

      await new DossierApprenantModel({
        ...createRandomDossierApprenant(),
        etablissement_reseaux: [etablissement_reseaux],
        formation_cfd: formationsSeed[2].cfd,
      }).save();

      const results = await searchFormations({ searchTerm, etablissement_reseaux });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and uai_etablissement", async () => {
      const searchTerm = "decoration";
      const uai_etablissement = "0762232N";

      await new DossierApprenantModel({
        ...createRandomDossierApprenant(),
        uai_etablissement,
        formation_cfd: formationsSeed[2].cfd,
      }).save();

      const results = await searchFormations({ searchTerm, uai_etablissement });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });
  });

  describe("getNiveauFormationFromLibelle", () => {
    const { getNiveauFormationFromLibelle } = formationsComponent();

    it("should return null when passed null", () => {
      assert.equal(getNiveauFormationFromLibelle(null), null);
    });

    it("should return null when passed empty string", () => {
      assert.equal(getNiveauFormationFromLibelle(null), null);
    });

    it("should return null when passed empty undefined", () => {
      assert.equal(getNiveauFormationFromLibelle(undefined), null);
    });

    it("should return null when it cannot parse number from passed string", () => {
      assert.equal(getNiveauFormationFromLibelle("BTS, DUT..."), null);
    });

    it("should return niveau when passed a number as string", () => {
      assert.equal(getNiveauFormationFromLibelle("0"), "0");
    });

    it("should return parsed niveau when passed a string", () => {
      assert.equal(getNiveauFormationFromLibelle("3 (BTS, DUT...)"), "3");
    });
  });
});
